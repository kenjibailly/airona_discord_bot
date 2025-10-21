const cron = require("node-cron");
const GuildModule = require("../models/GuildModule");

const WORLD_BOSSES = {
  "00": [
    // XX:00 spawns
    { name: "Golden Juggernaut", level: 10 },
    { name: "Inferno Ogre", level: 25 },
    { name: "Brigand Leader", level: 35 },
    { name: "Muku Chief", level: 45 },
    { name: "Storm Goblin King", level: 55 },
    { name: "Celestial Flier", level: 60 },
    { name: "Goblin King", level: 60 },
  ],
  30: [
    // XX:30 spawns
    { name: "Frost Ogre", level: 20 },
    { name: "Phantom Arachnocrab", level: 30 },
    { name: "Venobzzar Incubator", level: 40 },
    { name: "Iron Fang", level: 50 },
    { name: "Tempest Ogre", level: 60 },
    { name: "Lizardman King", level: 60 },
    { name: "Muku King", level: 60 },
  ],
};

// Special timed bosses (specific hours and minutes)
const SPECIAL_BOSSES = [
  {
    name: "Lovely Boarlet",
    level: "1",
    times: [
      { hour: 10, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 18, minute: 0 },
    ],
  },
  {
    name: "Breezy Boarlet",
    level: "1",
    times: [
      { hour: 12, minute: 0 },
      { hour: 16, minute: 0 },
      { hour: 20, minute: 0 },
    ],
  },
];

function hexToDecimal(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

async function sendBossNotification(
  client,
  guildId,
  settings,
  bossGroup,
  spawnTime
) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.warn(`Guild ${guildId} not found for world boss notification`);
      return;
    }

    const channel = guild.channels.cache.get(settings.channelId);
    if (!channel) {
      logger.warn(
        `Channel ${settings.channelId} not found in guild ${guild.name}`
      );
      return;
    }

    const role = guild.roles.cache.get(settings.roleId);
    const roleMention = role ? `<@&${role.id}>` : "@everyone";

    // Get current time and calculate spawn time
    const now = new Date();
    const spawnDate = new Date(now);
    spawnDate.setMinutes(spawnTime);
    spawnDate.setSeconds(0);

    // If spawn time has passed this hour, it's for next hour
    if (spawnDate <= now) {
      spawnDate.setHours(spawnDate.getHours() + 1);
    }

    const timeRemaining = Math.round((spawnDate - now) / 1000 / 60);

    // Create boss list
    const bossList = WORLD_BOSSES[bossGroup]
      .map((boss) => `• **${boss.name}** (Lv. ${boss.level})`)
      .join("\n");

    const embed = {
      title: "⚔️ World Boss Alert!",
      description: `World bosses are spawning in **${timeRemaining} minute${
        timeRemaining !== 1 ? "s" : ""
      }**!`,
      color: hexToDecimal(settings.embedColor || "#ff6b00"),
      fields: [
        {
          name: "Bosses Spawning",
          value: bossList,
          inline: false,
        },
        {
          name: "Spawn Time",
          value: `<t:${Math.floor(
            spawnDate.getTime() / 1000
          )}:t> (<t:${Math.floor(spawnDate.getTime() / 1000)}:R>)`,
          inline: true,
        },
      ],
      footer: {
        text: "Blue Protocol: Star Resonance",
      },
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      content: `${roleMention} World bosses incoming!`,
      embeds: [embed],
    });

    logger.success(`Sent world boss notification to ${guild.name}`);
  } catch (error) {
    logger.error(
      `Error sending world boss notification to guild ${guildId}:`,
      error
    );
  }
}

async function sendSpecialBossNotification(
  client,
  guildId,
  settings,
  boss,
  spawnTime
) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.warn(`Guild ${guildId} not found for special boss notification`);
      return;
    }

    const channel = guild.channels.cache.get(settings.channelId);
    if (!channel) {
      logger.warn(
        `Channel ${settings.channelId} not found in guild ${guild.name}`
      );
      return;
    }

    const role = guild.roles.cache.get(settings.roleId);
    const roleMention = role ? `<@&${role.id}>` : "@everyone";

    // Calculate exact spawn time
    const now = new Date();
    const spawnDate = new Date(now);
    spawnDate.setHours(spawnTime.hour);
    spawnDate.setMinutes(spawnTime.minute);
    spawnDate.setSeconds(0);

    // If spawn time has passed today, it's tomorrow
    if (spawnDate <= now) {
      spawnDate.setDate(spawnDate.getDate() + 1);
    }

    const timeRemaining = Math.round((spawnDate - now) / 1000 / 60);

    const embed = {
      title: "🐗 Special Boss Alert!",
      description: `**${boss.name}** is spawning in **${timeRemaining} minute${
        timeRemaining !== 1 ? "s" : ""
      }**!`,
      color: hexToDecimal(settings.embedColor || "#ff6b00"),
      fields: [
        {
          name: "Boss",
          value: `• **${boss.name}** (Lv. ${boss.level})`,
          inline: false,
        },
        {
          name: "Spawn Time",
          value: `<t:${Math.floor(
            spawnDate.getTime() / 1000
          )}:t> (<t:${Math.floor(spawnDate.getTime() / 1000)}:R>)`,
          inline: true,
        },
      ],
      footer: {
        text: "Blue Protocol: Star Resonance",
      },
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      content: `${roleMention} Special boss incoming!`,
      embeds: [embed],
    });

    logger.success(`Sent ${boss.name} notification to ${guild.name}`);
  } catch (error) {
    logger.error(
      `Error sending special boss notification to guild ${guildId}:`,
      error
    );
  }
}

async function checkAndNotify(client, spawnMinute) {
  try {
    // Find all guilds with world boss module enabled
    const activeModules = await GuildModule.find({
      moduleId: "worldboss",
      enabled: true,
    });

    for (const module of activeModules) {
      if (!module.settings.roleId || !module.settings.channelId) {
        continue; // Skip if not properly configured
      }

      const minutesBefore = module.settings.minutesBefore || 5;
      const now = new Date();
      const currentMinute = now.getMinutes();

      // Calculate when to send notification
      let notifyMinute = spawnMinute - minutesBefore;
      if (notifyMinute < 0) notifyMinute += 60;

      // Check if current minute matches notification time
      if (currentMinute === notifyMinute) {
        const bossGroup = spawnMinute.toString().padStart(2, "0");
        await sendBossNotification(
          client,
          module.guildId,
          module.settings,
          bossGroup,
          spawnMinute
        );
      }
    }
  } catch (error) {
    logger.error("Error in world boss scheduler:", error);
  }
}

async function checkSpecialBosses(client) {
  try {
    const activeModules = await GuildModule.find({
      moduleId: "worldboss",
      enabled: true,
    });

    for (const module of activeModules) {
      if (!module.settings.roleId || !module.settings.channelId) {
        continue;
      }

      const minutesBefore = module.settings.minutesBefore || 5;
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check each special boss
      for (const boss of SPECIAL_BOSSES) {
        for (const spawnTime of boss.times) {
          // Calculate notification time
          const notifyTime = new Date(now);
          notifyTime.setHours(spawnTime.hour);
          notifyTime.setMinutes(spawnTime.minute - minutesBefore);

          // Adjust if notification time crosses hour boundary
          if (notifyTime.getMinutes() < 0) {
            notifyTime.setHours(notifyTime.getHours() - 1);
            notifyTime.setMinutes(60 + notifyTime.getMinutes());
          }

          // Check if current time matches notification time
          if (
            currentHour === notifyTime.getHours() &&
            currentMinute === notifyTime.getMinutes()
          ) {
            await sendSpecialBossNotification(
              client,
              module.guildId,
              module.settings,
              boss,
              spawnTime
            );
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error checking special bosses:", error);
  }
}

function startWorldBossScheduler(client) {
  // Run every minute to check if we need to send notifications
  cron.schedule("* * * * *", async () => {
    // Check for XX:00 spawns
    await checkAndNotify(client, 0);

    // Check for XX:30 spawns
    await checkAndNotify(client, 30);

    // Check for special timed bosses
    await checkSpecialBosses(client);
  });

  logger.success("World Boss scheduler started");
}

module.exports = { startWorldBossScheduler };
