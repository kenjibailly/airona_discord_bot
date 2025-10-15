const express = require("express");
const router = express.Router();
const GuildSettings = require("../models/GuildSettings");

// Get settings for a guild
router.get("/:guildId", async (req, res) => {
  try {
    const settings = await GuildSettings.findOne({
      guildId: req.params.guildId,
    });
    res.json(settings || { guildId: req.params.guildId, settings: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings for a guild
router.post("/:guildId", async (req, res) => {
  try {
    const updated = await GuildSettings.findOneAndUpdate(
      { guildId: req.params.guildId },
      { settings: req.body },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
