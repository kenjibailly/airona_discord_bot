const express = require("express");
const router = express.Router();
const GuildModule = require("../models/GuildModule");
const ReactionRole = require("../models/ReactionRole");

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
      // In the GET "/:guildId/modules" route, update availableModules:
      const availableModules = [
        {
          id: "welcome",
          title: "Welcome Messages",
          description: "Send customized welcome messages when new members join",
          category: "general",
        },
        {
          id: "autorole",
          title: "Auto Role",
          description:
            "Automatically assign a role to new members when they join",
          category: "general",
        },
        {
          id: "reactionroles",
          title: "Reaction Roles",
          description:
            "Let members assign themselves roles by reacting to messages",
          category: "general",
        },
        // Blue Protocol Modules
        {
          id: "worldboss",
          title: "World Boss Notifier",
          description: "Get notifications before world bosses spawn",
          category: "blueprotocol",
        },
        {
          id: "events",
          title: "Events Notifier",
          description:
            "Get notifications for Boss events, Guild activities, and Leisure activities",
          category: "blueprotocol",
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

// Get all emojis for a guild
router.get(
  "/:guildId/emojis",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;

    try {
      const response = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/emojis`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      const emojis = response.data.map((emoji) => ({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.${
          emoji.animated ? "gif" : "png"
        }`,
      }));

      res.json({ emojis });
    } catch (err) {
      console.error(
        "Error fetching guild emojis:",
        err.response?.data || err.message
      );
      res.status(500).json({ error: "Failed to fetch guild emojis" });
    }
  }
);

// Get all reaction roles for a guild
router.get(
  "/:guildId/reaction-roles",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;

    try {
      const reactionRoles = await ReactionRole.find({ guildId }).sort({
        createdAt: -1,
      });
      res.json({ reactionRoles });
    } catch (err) {
      console.error("Error fetching reaction roles:", err);
      res.status(500).json({ error: "Failed to fetch reaction roles" });
    }
  }
);

// Get specific reaction role
router.put(
  "/:guildId/reaction-roles/:reactionRoleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, reactionRoleId } = req.params;
    const {
      name,
      messageLink,
      reactions,
      type,
      allowedRoles,
      ignoredRoles,
      allowMultiple,
      keepCounterAtOne,
    } = req.body;

    try {
      const reactionRole = await ReactionRole.findOne({
        _id: reactionRoleId,
        guildId,
      });

      if (!reactionRole) {
        return res.status(404).json({ error: "Reaction role not found" });
      }

      // Parse message link
      const linkMatch = messageLink.match(/channels\/(\d+)\/(\d+)\/(\d+)/);

      if (!linkMatch) {
        return res.status(400).json({ error: "Invalid message link format" });
      }

      const [, linkGuildId, channelId, messageId] = linkMatch;

      if (linkGuildId !== guildId) {
        return res
          .status(400)
          .json({ error: "Message link is from a different server" });
      }

      // If message changed, verify new message exists
      if (messageId !== reactionRole.messageId) {
        try {
          await axios.get(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          return res
            .status(400)
            .json({ error: "Message not found or bot doesn't have access" });
        }

        // Clear old message reactions
        try {
          await axios.delete(
            `https://discord.com/api/v10/channels/${reactionRole.channelId}/messages/${reactionRole.messageId}/reactions`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          console.error(
            "Failed to clear old reactions:",
            err.response?.data || err.message
          );
        }
      } else {
        // Same message, but check for removed reactions
        const oldEmojis = reactionRole.reactions.map((r) => r.emoji);
        const newEmojis = reactions.map((r) => r.emoji);
        const removedEmojis = oldEmojis.filter(
          (emoji) => !newEmojis.includes(emoji)
        );

        // Remove reactions that were deleted from config
        for (const oldReaction of reactionRole.reactions) {
          if (removedEmojis.includes(oldReaction.emoji)) {
            try {
              const emojiStr = oldReaction.isCustom
                ? `${oldReaction.emojiName}:${oldReaction.emoji}`
                : oldReaction.emoji;

              await axios.delete(
                `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
                  emojiStr
                )}`,
                {
                  headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                  },
                }
              );
              console.log(`Removed reaction ${emojiStr} from message`);
            } catch (err) {
              console.error(
                `Failed to remove reaction ${oldReaction.emoji}:`,
                err.response?.data || err.message
              );
            }
          }
        }
      }

      // Update fields
      reactionRole.name = name;
      reactionRole.messageLink = messageLink;
      reactionRole.channelId = channelId;
      reactionRole.messageId = messageId;
      reactionRole.reactions = reactions;
      reactionRole.type = type;
      reactionRole.allowedRoles = allowedRoles || [];
      reactionRole.ignoredRoles = ignoredRoles || [];
      reactionRole.allowMultiple = allowMultiple;
      reactionRole.keepCounterAtOne = keepCounterAtOne;
      reactionRole.updatedAt = new Date();

      await reactionRole.save();

      // Add new reactions to the message
      for (const reaction of reactions) {
        try {
          const emojiStr = reaction.isCustom
            ? `${reaction.emojiName}:${reaction.emoji}`
            : reaction.emoji;
          await axios.put(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
              emojiStr
            )}/@me`,
            {},
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          console.error(
            `Failed to add reaction ${reaction.emoji}:`,
            err.response?.data || err.message
          );
        }
      }

      res.json({ success: true, reactionRole });
    } catch (err) {
      console.error("Error updating reaction role:", err);
      res.status(500).json({ error: "Failed to update reaction role" });
    }
  }
);

// Create reaction role
router.post(
  "/:guildId/reaction-roles",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId } = req.params;
    const {
      name,
      messageLink,
      reactions,
      type,
      allowedRoles,
      ignoredRoles,
      allowMultiple,
      keepCounterAtOne,
    } = req.body;

    try {
      // Parse message link to extract channel and message IDs
      // Format: https://discord.com/channels/{guildId}/{channelId}/{messageId}
      const linkMatch = messageLink.match(/channels\/(\d+)\/(\d+)\/(\d+)/);

      if (!linkMatch) {
        return res.status(400).json({ error: "Invalid message link format" });
      }

      const [, linkGuildId, channelId, messageId] = linkMatch;

      if (linkGuildId !== guildId) {
        return res
          .status(400)
          .json({ error: "Message link is from a different server" });
      }

      // Verify message exists
      try {
        await axios.get(
          `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          }
        );
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Message not found or bot doesn't have access" });
      }

      const reactionRole = new ReactionRole({
        guildId,
        name,
        messageLink,
        channelId,
        messageId,
        reactions,
        type,
        allowedRoles: allowedRoles || [],
        ignoredRoles: ignoredRoles || [],
        allowMultiple,
        keepCounterAtOne,
      });

      await reactionRole.save();

      // Add reactions to the message
      for (const reaction of reactions) {
        try {
          const emojiStr = reaction.isCustom
            ? `${reaction.emojiName}:${reaction.emoji}`
            : reaction.emoji;
          await axios.put(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
              emojiStr
            )}/@me`,
            {},
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          console.error(
            `Failed to add reaction ${reaction.emoji}:`,
            err.response?.data || err.message
          );
        }
      }

      logger.success(`Created reaction role "${name}" for guild ${guildId}`);

      res.json({ success: true, reactionRole });
    } catch (err) {
      console.error("Error creating reaction role:", err);
      res.status(500).json({ error: "Failed to create reaction role" });
    }
  }
);

// Update reaction role
router.put(
  "/:guildId/reaction-roles/:reactionRoleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, reactionRoleId } = req.params;
    const {
      name,
      messageLink,
      reactions,
      type,
      allowedRoles,
      ignoredRoles,
      allowMultiple,
      keepCounterAtOne,
    } = req.body;

    try {
      const reactionRole = await ReactionRole.findOne({
        _id: reactionRoleId,
        guildId,
      });

      if (!reactionRole) {
        return res.status(404).json({ error: "Reaction role not found" });
      }

      // Parse message link
      const linkMatch = messageLink.match(/channels\/(\d+)\/(\d+)\/(\d+)/);

      if (!linkMatch) {
        return res.status(400).json({ error: "Invalid message link format" });
      }

      const [, linkGuildId, channelId, messageId] = linkMatch;

      if (linkGuildId !== guildId) {
        return res
          .status(400)
          .json({ error: "Message link is from a different server" });
      }

      // If message changed, verify new message exists
      if (messageId !== reactionRole.messageId) {
        try {
          await axios.get(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          return res
            .status(400)
            .json({ error: "Message not found or bot doesn't have access" });
        }

        // Clear old message reactions
        try {
          await axios.delete(
            `https://discord.com/api/v10/channels/${reactionRole.channelId}/messages/${reactionRole.messageId}/reactions`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          console.error(
            "Failed to clear old reactions:",
            err.response?.data || err.message
          );
        }
      }

      // Update fields
      reactionRole.name = name;
      reactionRole.messageLink = messageLink;
      reactionRole.channelId = channelId;
      reactionRole.messageId = messageId;
      reactionRole.reactions = reactions;
      reactionRole.type = type;
      reactionRole.allowedRoles = allowedRoles || [];
      reactionRole.ignoredRoles = ignoredRoles || [];
      reactionRole.allowMultiple = allowMultiple;
      reactionRole.keepCounterAtOne = keepCounterAtOne;
      reactionRole.updatedAt = new Date();

      await reactionRole.save();

      // Add new reactions to the message
      for (const reaction of reactions) {
        try {
          const emojiStr = reaction.isCustom
            ? `${reaction.emojiName}:${reaction.emoji}`
            : reaction.emoji;
          await axios.put(
            `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(
              emojiStr
            )}/@me`,
            {},
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
        } catch (err) {
          console.error(
            `Failed to add reaction ${reaction.emoji}:`,
            err.response?.data || err.message
          );
        }
      }

      res.json({ success: true, reactionRole });
    } catch (err) {
      console.error("Error updating reaction role:", err);
      res.status(500).json({ error: "Failed to update reaction role" });
    }
  }
);

// Get specific reaction role
router.get(
  "/:guildId/reaction-roles/:reactionRoleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, reactionRoleId } = req.params;

    try {
      const reactionRole = await ReactionRole.findOne({
        _id: reactionRoleId,
        guildId,
      });

      if (!reactionRole) {
        return res.status(404).json({ error: "Reaction role not found" });
      }

      res.json(reactionRole);
    } catch (err) {
      console.error("Error fetching reaction role:", err);
      res.status(500).json({ error: "Failed to fetch reaction role" });
    }
  }
);

// Then your PUT route comes after this...
router.put(
  "/:guildId/reaction-roles/:reactionRoleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    // ... your existing PUT code
  }
);

// Delete reaction role
router.delete(
  "/:guildId/reaction-roles/:reactionRoleId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, reactionRoleId } = req.params;

    try {
      const reactionRole = await ReactionRole.findOne({
        _id: reactionRoleId,
        guildId,
      });

      if (!reactionRole) {
        return res.status(404).json({ error: "Reaction role not found" });
      }

      // Clear message reactions
      try {
        await axios.delete(
          `https://discord.com/api/v10/channels/${reactionRole.channelId}/messages/${reactionRole.messageId}/reactions`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          }
        );
      } catch (err) {
        console.error(
          "Failed to clear reactions:",
          err.response?.data || err.message
        );
      }

      await reactionRole.deleteOne();

      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting reaction role:", err);
      res.status(500).json({ error: "Failed to delete reaction role" });
    }
  }
);

// Get message content (for editing)
router.get(
  "/:guildId/message/:channelId/:messageId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, channelId, messageId } = req.params;

    try {
      const response = await axios.get(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );

      res.json({
        content: response.data.content || "",
        embeds: response.data.embeds || [],
        components: response.data.components || [],
      });
    } catch (err) {
      console.error(
        "Error fetching message:",
        err.response?.data || err.message
      );
      res.status(500).json({ error: "Failed to fetch message" });
    }
  }
);

// Send new message with embed
router.post(
  "/:guildId/message/:channelId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, channelId } = req.params;
    const { content, embeds, components } = req.body;

    try {
      // Clean up embeds - remove empty fields but keep actual content
      const cleanedEmbeds = embeds
        .map((embed) => {
          const cleaned = { ...embed };

          // Remove author if empty or only placeholder
          if (!cleaned.author?.name || cleaned.author.name === "Author name") {
            delete cleaned.author;
          } else if (cleaned.author) {
            // Keep author but remove empty URLs
            if (!cleaned.author.url) delete cleaned.author.url;
            if (!cleaned.author.icon_url) delete cleaned.author.icon_url;
          }

          // Remove title if it's empty or placeholder
          if (!cleaned.title || cleaned.title === "Embed title") {
            delete cleaned.title;
            delete cleaned.url; // Remove URL if no title
          } else if (!cleaned.url) {
            delete cleaned.url;
          }

          // Remove description if it's empty or placeholder
          if (
            !cleaned.description ||
            cleaned.description === "Embed description"
          ) {
            delete cleaned.description;
          }

          // Remove footer if empty or only placeholder
          if (!cleaned.footer?.text || cleaned.footer.text === "Footer text") {
            delete cleaned.footer;
          } else if (cleaned.footer) {
            if (!cleaned.footer.icon_url) delete cleaned.footer.icon_url;
          }

          // Remove empty fields
          if (cleaned.fields) {
            cleaned.fields = cleaned.fields.filter((f) => f.name && f.value);
            if (cleaned.fields.length === 0) delete cleaned.fields;
          }

          // Remove empty images
          if (cleaned.image && !cleaned.image.url) {
            delete cleaned.image;
          }

          if (cleaned.thumbnail && !cleaned.thumbnail.url) {
            delete cleaned.thumbnail;
          }

          // Remove images array (not supported by Discord API)
          delete cleaned.images;

          // Remove empty timestamp
          if (!cleaned.timestamp) {
            delete cleaned.timestamp;
          }

          return cleaned;
        })
        .filter((embed) => {
          // Remove completely empty embeds
          return Object.keys(embed).length > 1; // More than just color
        });

      const payload = {};

      if (content) payload.content = content;
      if (cleanedEmbeds.length > 0) payload.embeds = cleanedEmbeds;
      if (components && components.length > 0) payload.components = components;

      // Must have at least content or embeds
      if (
        !payload.content &&
        (!payload.embeds || payload.embeds.length === 0)
      ) {
        return res
          .status(400)
          .json({ error: "Message must have content or embeds" });
      }

      const response = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.success(
        `Sent embed message to channel ${channelId} in guild ${guildId}`
      );
      res.json({ success: true, message: response.data });
    } catch (err) {
      console.error(
        "Error sending message:",
        err.response?.data || err.message
      );
      res.status(500).json({
        error: err.response?.data?.message || "Failed to send message",
      });
    }
  }
);

// Edit existing message
router.put(
  "/:guildId/message/:channelId/:messageId",
  requireAuth,
  checkGuildPermission,
  async (req, res) => {
    const { guildId, channelId, messageId } = req.params;
    const { content, embeds, components } = req.body;

    try {
      // Clean up embeds - remove empty fields but keep actual content
      const cleanedEmbeds = embeds
        .map((embed) => {
          const cleaned = { ...embed };

          // Remove author if empty or only placeholder
          if (!cleaned.author?.name || cleaned.author.name === "Author name") {
            delete cleaned.author;
          } else if (cleaned.author) {
            if (!cleaned.author.url) delete cleaned.author.url;
            if (!cleaned.author.icon_url) delete cleaned.author.icon_url;
          }

          // Remove title if it's empty or placeholder
          if (!cleaned.title || cleaned.title === "Embed title") {
            delete cleaned.title;
            delete cleaned.url;
          } else if (!cleaned.url) {
            delete cleaned.url;
          }

          // Remove description if it's empty or placeholder
          if (
            !cleaned.description ||
            cleaned.description === "Embed description"
          ) {
            delete cleaned.description;
          }

          // Remove footer if empty or only placeholder
          if (!cleaned.footer?.text || cleaned.footer.text === "Footer text") {
            delete cleaned.footer;
          } else if (cleaned.footer) {
            if (!cleaned.footer.icon_url) delete cleaned.footer.icon_url;
          }

          // Remove empty fields
          if (cleaned.fields) {
            cleaned.fields = cleaned.fields.filter((f) => f.name && f.value);
            if (cleaned.fields.length === 0) delete cleaned.fields;
          }

          // Remove empty images
          if (cleaned.image && !cleaned.image.url) {
            delete cleaned.image;
          }

          if (cleaned.thumbnail && !cleaned.thumbnail.url) {
            delete cleaned.thumbnail;
          }

          // Remove images array
          delete cleaned.images;

          // Remove empty timestamp
          if (!cleaned.timestamp) {
            delete cleaned.timestamp;
          }

          return cleaned;
        })
        .filter((embed) => {
          return Object.keys(embed).length > 1;
        });

      const payload = {};

      if (content !== undefined) payload.content = content;
      if (cleanedEmbeds.length > 0) payload.embeds = cleanedEmbeds;
      if (components !== undefined) payload.components = components;

      const response = await axios.patch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
        payload,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.success(`Edited message ${messageId} in channel ${channelId}`);
      res.json({ success: true, message: response.data });
    } catch (err) {
      console.error(
        "Error editing message:",
        err.response?.data || err.message
      );
      res.status(500).json({
        error: err.response?.data?.message || "Failed to edit message",
      });
    }
  }
);

module.exports = router;
