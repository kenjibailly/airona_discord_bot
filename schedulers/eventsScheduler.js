const cron = require("node-cron");
const GuildModule = require("../models/GuildModule");

// All times are in UTC-2 (which is UTC+2 hours to convert TO UTC-2)
// So we need to add 2 hours to the times to get UTC
const EVENTS = {
  boss: [
    {
      name: "World Boss Crusade",
      startTime: { hour: 20, minute: 0 }, // 20:00 UTC-2 = 22:00 UTC
      endTime: { hour: 2, minute: 0 }, // 02:00 UTC-2 = 04:00 UTC (next day)
      days: [0, 1, 2, 3, 4, 5, 6], // Every day
      duration: 360, // 6 hours
    },
  ],
  guildActivity: [
    {
      name: "Guild Hunt",
      startTime: { hour: 14, minute: 0 }, // 14:00 UTC-2 = 16:00 UTC
      endTime: { hour: 4, minute: 0 }, // 04:00 UTC-2 = 06:00 UTC (next day)
      days: [5, 6, 0], // Friday, Saturday, Sunday
      duration: 840, // 14 hours
    },
    {
      name: "Guild Dance",
      startTime: { hour: 15, minute: 30 }, // 15:30 UTC-2 = 17:30 UTC
      endTime: { hour: 3, minute: 30 }, // 03:30 UTC-2 = 05:30 UTC (next day)
      days: [5], // Friday
      duration: 720, // 12 hours
    },
  ],
  leisure: [
    {
      name: "Muku Camp Patrol",
      times: [
        { hour: 13, minute: 45 }, // 13:45 UTC-2 = 15:45 UTC
        { hour: 18, minute: 45 }, // 18:45 UTC-2 = 20:45 UTC
        { hour: 23, minute: 45 }, // 23:45 UTC-2 = 01:45 UTC (next day)
      ],
      days: [0, 1, 2, 3, 4, 5, 6],
      duration: null, // Unknown duration
    },
    {
      name: "Ancient City Patrol",
      times: [
        { hour: 11, minute: 15 }, // 11:15 UTC-2 = 13:15 UTC
        { hour: 16, minute: 15 }, // 16:15 UTC-2 = 18:15 UTC
        { hour: 21, minute: 15 }, // 21:15 UTC-2 = 23:15 UTC
      ],
      days: [0, 1, 2, 3, 4, 5, 6],
      duration: null,
    },
    {
      name: "Brigand Camp Patrol",
      times: [
        { hour: 12, minute: 45 }, // 12:45 UTC-2 = 14:45 UTC
        { hour: 17, minute: 45 }, // 17:45 UTC-2 = 19:45 UTC
        { hour: 22, minute: 45 }, // 22:45 UTC-2 = 00:45 UTC (next day)
      ],
      days: [0, 1, 2, 3, 4, 5, 6],
      duration: null,
    },
    {
      name: "Dance Novice",
      times: [
        { hour: 15, minute: 0 }, // 15:00 UTC-2 = 17:00 UTC
        { hour: 17, minute: 0 }, // 17:00 UTC-2 = 19:00 UTC
        { hour: 20, minute: 0 }, // 20:00 UTC-2 = 22:00 UTC
        { hour: 23, minute: 0 }, // 23:00 UTC-2 = 01:00 UTC (next day)
      ],
      days: [1, 3, 5, 0], // Monday, Wednesday, Friday, Sunday
      duration: 60, // 1 hour
    },
    {
      name: "Street Theater",
      times: [
        { hour: 15, minute: 0 },
        { hour: 17, minute: 0 },
        { hour: 20, minute: 0 },
        { hour: 23, minute: 0 },
      ],
      days: [2, 4, 6, 0], // Tuesday, Thursday, Saturday, Sunday
      duration: 60,
    },
  ],
};

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

    const channel = guild.channels.cache.get(settings.channelId);
    if (!channel) {
      logger.warn(
        `Channel ${settings.channelId} not found in guild ${guild.name}`
      );
      return;
    }

    // Get the appropriate role based on category
    let roleId;
    if (category === "boss") roleId = settings.bossRoleId;
    else if (category === "guildActivity")
      roleId = settings.guildActivityRoleId;
    else if (category === "leisure") roleId = settings.leisureRoleId;

    if (!roleId) return; // No role configured for this category

    const role = guild.roles.cache.get(roleId);
    const roleMention = role ? `<@&${role.id}>` : "@everyone";

    // Calculate event start time in UTC-2 timezone
    const now = new Date();
    const eventDate = new Date(now);

    // Set to UTC-2 time
    eventDate.setUTCHours(eventTime.hour + 2); // Convert UTC-2 to UTC
    eventDate.setUTCMinutes(eventTime.minute);
    eventDate.setUTCSeconds(0);

    // If the event time has passed today, it's tomorrow
    if (eventDate <= now) {
      eventDate.setDate(eventDate.getDate() + 1);
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
      if (!module.settings.channelId) continue;

      const now = new Date();
      const currentDay = now.getUTCDay();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();

      // Check Boss Events
      if (module.settings.bossRoleId) {
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

      // Check Guild Activities
      if (module.settings.guildActivityRoleId) {
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

      // Check Leisure Activities
      if (module.settings.leisureRoleId) {
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

module.exports = { startEventsScheduler };
