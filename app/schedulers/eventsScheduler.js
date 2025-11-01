const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const GuildModule = require("../models/GuildModule");

// Load events from JSON file
// Try multiple possible paths for different environments
const POSSIBLE_PATHS = [
  path.join(__dirname, "..", "config", "events.json"), // Standard path
  path.join(process.cwd(), "config", "events.json"), // From root
];

let EVENTS = {};
let EVENTS_FILE = null;

function loadEvents() {
  for (const filePath of POSSIBLE_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        EVENTS = JSON.parse(data);
        EVENTS_FILE = filePath;
        logger.success(`Events loaded from ${filePath}`);
        return;
      }
    } catch (error) {
      // Try next path
      continue;
    }
  }

  // If we get here, no file was found
  logger.error("Could not find events.json in any expected location");
  logger.info("Tried paths:", POSSIBLE_PATHS);
  // Fallback to empty events object
  EVENTS = { boss: [], guildActivity: [], leisure: [] };
}

// Load events on startup
loadEvents();

function hexToDecimal(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

// Convert UTC-2 time to UTC
function convertToUTC(hour, minute) {
  let utcHour = hour + 2; // UTC-2 to UTC
  let utcDay = 0;

  if (utcHour >= 24) {
    utcHour -= 24;
    utcDay = 1; // Next day
  }

  return { hour: utcHour, minute, dayOffset: utcDay };
}

async function sendEventNotification(
  client,
  guildId,
  settings,
  event,
  category,
  eventTime
) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.warn(`Guild ${guildId} not found for event notification`);
      return;
    }

    // Select channel + role based on category
    let channelId = null;
    let roleId = null;

    if (category === "boss") {
      channelId = settings.bossChannelId;
      roleId = settings.bossRoleId;
    } else if (category === "guildActivity") {
      channelId = settings.guildActivityChannelId;
      roleId = settings.guildActivityRoleId;
    } else if (category === "leisure") {
      channelId = settings.leisureChannelId;
      roleId = settings.leisureRoleId;
    }

    // Skip if no channel configured for this category
    if (!channelId) {
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      logger.warn(
        `Channel ${channelId} not found in guild ${guild.name} for category ${category}`
      );
      return;
    }

    // If no role is configured, send message without ping
    let roleMention = "";
    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      roleMention = role ? `<@&${role.id}>` : "";
    }

    // Calculate event start time
    // eventTime is in UTC-2, so we need to convert it to UTC
    const utcTime = convertToUTC(eventTime.hour, eventTime.minute);
    const now = new Date();
    const eventDate = new Date(now);

    // Set to UTC time (already converted from UTC-2)
    eventDate.setUTCHours(utcTime.hour);
    eventDate.setUTCMinutes(utcTime.minute);
    eventDate.setUTCSeconds(0);
    eventDate.setUTCMilliseconds(0);

    // If the event time has passed today, it's tomorrow
    if (eventDate <= now) {
      eventDate.setUTCDate(eventDate.getUTCDate() + 1);
    }

    const timeRemaining = Math.round((eventDate - now) / 1000 / 60);

    // Build embed
    const embed = {
      title: `📅 ${event.name}`,
      color: hexToDecimal(settings.embedColor || "#00b4d8"),
      fields: [
        {
          name: "⏰ Starts",
          value: `<t:${Math.floor(
            eventDate.getTime() / 1000
          )}:t> (<t:${Math.floor(eventDate.getTime() / 1000)}:R>)`,
          inline: true,
        },
      ],
      footer: {
        text: "Blue Protocol: Star Resonance",
      },
      timestamp: new Date().toISOString(),
    };

    // Add duration if available
    if (event.duration) {
      const endDate = new Date(eventDate.getTime() + event.duration * 60000);
      embed.fields.push({
        name: "⏱️ Duration",
        value: `${event.duration} minutes`,
        inline: true,
      });
      embed.fields.push({
        name: "🏁 Ends",
        value: `<t:${Math.floor(endDate.getTime() / 1000)}:t> (<t:${Math.floor(
          endDate.getTime() / 1000
        )}:R>)`,
        inline: true,
      });
    }

    // Add category emoji
    let categoryEmoji = "📌";
    if (category === "boss") categoryEmoji = "🔥";
    else if (category === "guildActivity") categoryEmoji = "⚔️";
    else if (category === "leisure") categoryEmoji = "🎯";

    embed.description = `${categoryEmoji} Event starting in **${timeRemaining} minute${
      timeRemaining !== 1 ? "s" : ""
    }**!`;

    await channel.send({
      content: `${roleMention}`,
      embeds: [embed],
    });

    logger.success(`Sent ${event.name} notification to ${guild.name}`);
  } catch (error) {
    logger.error(
      `Error sending event notification to guild ${guildId}:`,
      error
    );
  }
}

async function checkEvents(client) {
  try {
    const activeModules = await GuildModule.find({
      moduleId: "events",
      enabled: true,
    });

    for (const module of activeModules) {
      // Skip if no channels are configured at all
      if (
        !module.settings.bossChannelId &&
        !module.settings.guildActivityChannelId &&
        !module.settings.leisureChannelId
      ) {
        continue;
      }

      const now = new Date();
      const currentDay = now.getUTCDay();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();

      // Check Boss Events (only if channel is configured)
      if (
        module.settings.bossChannelId &&
        EVENTS.boss &&
        EVENTS.boss.length > 0
      ) {
        const minutesBefore = module.settings.bossMinutesBefore || 5;

        for (const event of EVENTS.boss) {
          if (!event.days.includes(currentDay)) continue;

          const utcTime = convertToUTC(
            event.startTime.hour,
            event.startTime.minute
          );
          const notifyTime = new Date();
          notifyTime.setUTCHours(utcTime.hour);
          notifyTime.setUTCMinutes(utcTime.minute - minutesBefore);

          if (
            notifyTime.getUTCHours() === currentHour &&
            notifyTime.getUTCMinutes() === currentMinute
          ) {
            await sendEventNotification(
              client,
              module.guildId,
              module.settings,
              event,
              "boss",
              event.startTime
            );
          }
        }
      }

      // Check Guild Activities (only if channel is configured)
      if (
        module.settings.guildActivityChannelId &&
        EVENTS.guildActivity &&
        EVENTS.guildActivity.length > 0
      ) {
        const minutesBefore = module.settings.guildActivityMinutesBefore || 5;

        for (const event of EVENTS.guildActivity) {
          if (!event.days.includes(currentDay)) continue;

          const utcTime = convertToUTC(
            event.startTime.hour,
            event.startTime.minute
          );
          const notifyTime = new Date();
          notifyTime.setUTCHours(utcTime.hour);
          notifyTime.setUTCMinutes(utcTime.minute - minutesBefore);

          if (
            notifyTime.getUTCHours() === currentHour &&
            notifyTime.getUTCMinutes() === currentMinute
          ) {
            await sendEventNotification(
              client,
              module.guildId,
              module.settings,
              event,
              "guildActivity",
              event.startTime
            );
          }
        }
      }

      // Check Leisure Activities (only if channel is configured)
      if (
        module.settings.leisureChannelId &&
        EVENTS.leisure &&
        EVENTS.leisure.length > 0
      ) {
        const minutesBefore = module.settings.leisureMinutesBefore || 5;

        for (const event of EVENTS.leisure) {
          if (!event.days.includes(currentDay)) continue;

          for (const time of event.times) {
            const utcTime = convertToUTC(time.hour, time.minute);
            const notifyTime = new Date();
            notifyTime.setUTCHours(utcTime.hour);
            notifyTime.setUTCMinutes(utcTime.minute - minutesBefore);

            if (
              notifyTime.getUTCHours() === currentHour &&
              notifyTime.getUTCMinutes() === currentMinute
            ) {
              const eventWithTime = { ...event, startTime: time };
              await sendEventNotification(
                client,
                module.guildId,
                module.settings,
                eventWithTime,
                "leisure",
                time
              );
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error in events scheduler:", error);
  }
}

function startEventsScheduler(client) {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await checkEvents(client);
  });

  logger.success("Events scheduler started");
}

// Export function to reload events (useful for updating without restart)
function reloadEvents() {
  loadEvents();
}

module.exports = { startEventsScheduler, reloadEvents };
