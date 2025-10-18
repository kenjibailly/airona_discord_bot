const { Events } = require("discord.js");
const botJoinsGuild = require("../bot_joins_guild");

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    botJoinsGuild(this.client, guild);
  },
};
