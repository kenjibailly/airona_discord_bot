const mongoose = require("mongoose");

const GuildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  settings: {
    welcomeMessage: { type: String, default: "Welcome to the server!" },
    modules: { type: Object, default: {} },
  },
});

module.exports = mongoose.model("GuildSettings", GuildSettingsSchema);
