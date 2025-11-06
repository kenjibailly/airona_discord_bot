const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  class: { type: String, required: true },
  spec: { type: String, required: true },
  range: { type: String, required: true },
  queueSpot: { type: Number, default: null }, // 👈 only used for bench members
});

const dungeonPartySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    dungeonName: { type: String, required: true },
    tanks: { type: [memberSchema], default: [] },
    healers: { type: [memberSchema], default: [] },
    dps: { type: [memberSchema], default: [] },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    createdBy: { type: String, required: true },
    date: { type: String },
    time: { type: String },
    utc: { type: String },
    bench: {
      tanks: { type: [memberSchema], default: [] },
      healers: { type: [memberSchema], default: [] },
      dps: { type: [memberSchema], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DungeonParty", dungeonPartySchema);
