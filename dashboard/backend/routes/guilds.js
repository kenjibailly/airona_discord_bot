const express = require("express");
const router = express.Router();
const GuildModule = require("../models/GuildModule");

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Middleware to check if user has permission for the guild
function checkGuildPermission(req, res, next) {
  const { guildId } = req.params;
  const userGuilds = req.session.guilds || [];

  const hasAccess = userGuilds.some((g) => g.id === guildId);

  if (!hasAccess) {
    return res.status(403).json({ error: "No permission for this guild" });
  }

  next();
}

// Get all modules for a guild
router.get(
  "/:guildId/modules",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;

    try {
      // Define available modules (you can move this to a config file later)
      const availableModules = [
        {
          id: "welcome",
          title: "Welcome Messages",
          description: "Send customized welcome messages when new members join",
        },
        {
          id: "autorole",
          title: "Auto Role",
          description:
            "Automatically assign a role to new members when they join",
        },
      ];

      // Get module states from database
      const dbModules = await GuildModule.find({ guildId });

      // Create a map of module states
      const moduleStates = {};
      dbModules.forEach((mod) => {
        moduleStates[mod.moduleId] = {
          enabled: mod.enabled,
          settings: mod.settings,
        };
      });

      // Combine available modules with their states
      const modules = availableModules.map((mod) => ({
        ...mod,
        enabled: moduleStates[mod.id]?.enabled || false,
        settings: moduleStates[mod.id]?.settings || {},
      }));

      console.log(`Fetched modules for guild ${guildId}:`, modules);

      res.json({ modules });
    } catch (err) {
      console.error("Error fetching modules:", err);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  }
);

// Toggle module for a guild
router.post(
  "/:guildId/modules/:moduleId/toggle",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, moduleId } = req.params;
    const { enabled } = req.body;

    console.log(
      `Toggle request - Guild: ${guildId}, Module: ${moduleId}, Enabled: ${enabled}`
    );

    try {
      // Find or create the module document
      let guildModule = await GuildModule.findOne({ guildId, moduleId });

      if (guildModule) {
        // Update existing
        guildModule.enabled = enabled;
        guildModule.updatedAt = new Date();
        await guildModule.save();
      } else {
        // Create new
        guildModule = new GuildModule({
          guildId,
          moduleId,
          enabled,
        });
        await guildModule.save();
      }

      console.log(`Module ${moduleId} for guild ${guildId} set to ${enabled}`);

      res.json({
        success: true,
        guildId,
        moduleId,
        enabled,
        updatedAt: guildModule.updatedAt,
      });
    } catch (err) {
      console.error("Error toggling module:", err);
      res.status(500).json({ error: "Failed to toggle module" });
    }
  }
);

// Get specific module settings
router.get(
  "/:guildId/modules/:moduleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, moduleId } = req.params;

    try {
      let guildModule = await GuildModule.findOne({ guildId, moduleId });

      if (!guildModule) {
        // Return default state if not found
        return res.json({
          guildId,
          moduleId,
          enabled: false,
          settings: {},
        });
      }

      res.json({
        guildId: guildModule.guildId,
        moduleId: guildModule.moduleId,
        enabled: guildModule.enabled,
        settings: guildModule.settings,
        updatedAt: guildModule.updatedAt,
      });
    } catch (err) {
      console.error("Error fetching module:", err);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  }
);

// Update module settings (for detailed settings page)
router.put(
  "/:guildId/modules/:moduleId/settings",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, moduleId } = req.params;
    const { settings } = req.body;

    console.log(
      `Update settings - Guild: ${guildId}, Module: ${moduleId}`,
      settings
    );

    try {
      let guildModule = await GuildModule.findOne({ guildId, moduleId });

      if (guildModule) {
        guildModule.settings = settings;
        guildModule.updatedAt = new Date();
        await guildModule.save();
      } else {
        // Create with settings
        guildModule = new GuildModule({
          guildId,
          moduleId,
          enabled: false,
          settings,
        });
        await guildModule.save();
      }

      res.json({
        success: true,
        guildId,
        moduleId,
        settings: guildModule.settings,
        updatedAt: guildModule.updatedAt,
      });
    } catch (err) {
      console.error("Error updating module settings:", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

const axios = require("axios");

// Add this route after your existing routes
router.get(
  "/:guildId/channels",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;

    try {
      // Fetch channels from Discord API
      const response = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      // Filter to only text channels (type 0) and announcement channels (type 5)
      const textChannels = response.data
        .filter((channel) => channel.type === 0 || channel.type === 5)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position,
        }))
        .sort((a, b) => a.position - b.position); // Sort by position

      console.log(
        `Fetched ${textChannels.length} text channels for guild ${guildId}`
      );

      res.json({ channels: textChannels });
    } catch (err) {
      console.error("Error fetching guild channels:", err);
      res.status(500).json({ error: "Failed to fetch guild channels" });
    }
  }
);

router.get(
  "/:guildId/roles",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;

    try {
      // Fetch roles from Discord API
      const response = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      // Filter out @everyone role and sort by position (highest first)
      const roles = response.data
        .filter((role) => role.name !== "@everyone")
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
          managed: role.managed, // Managed roles (like bot roles) can't be assigned
        }))
        .sort((a, b) => b.position - a.position);

      console.log(`Fetched ${roles.length} roles for guild ${guildId}`);

      res.json({ roles });
    } catch (err) {
      console.error(
        "Error fetching guild roles:",
        err.response?.data || err.message
      );
      res.status(500).json({ error: "Failed to fetch guild roles" });
    }
  }
);

module.exports = router;
