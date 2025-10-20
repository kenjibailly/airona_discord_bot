const { Events } = require("discord.js");
const { startWorldBossScheduler } = require("../schedulers/worldBossScheduler");
const { startEventsScheduler } = require("./schedulers/eventsScheduler");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.success(`Logged in as ${client.user.tag}!`);
    // Start world boss scheduler
    startWorldBossScheduler(client);
    startEventsScheduler(client);
  },
};
