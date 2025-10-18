const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.success(`Logged in as ${client.user.tag}!`);
  },
};
