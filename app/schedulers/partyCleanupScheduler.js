const cron = require("node-cron");
const RaidParties = require("../models/RaidParties");
const GuildModule = require("../models/GuildModule");

async function startPartyCleanupScheduler(client) {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const parties = await RaidParties.find();

      for (const party of parties) {
        // Find the guild module settings for this guild
        const guildModule = await GuildModule.findOne({
          guildId: party.guildId,
          moduleId: "party_raid",
        });

        const deleteAfterHours = guildModule?.settings?.deleteAfter ?? 24; // default to 24h if not set

        let partyDateTime;

        if (party.date && party.time) {
          const [day, month] = party.date.split("/").map(Number);
          const [hour, minute] = party.time.split(":").map(Number);
          const year = now.getUTCFullYear();

          let offsetHours = 0;
          let offsetMinutes = 0;

          if (party.utc && party.utc.startsWith("UTC")) {
            const match = party.utc.match(/UTC([+-−])(\d{1,2}):(\d{2})/);
            if (match) {
              const sign = match[1] === "−" || match[1] === "-" ? -1 : 1;
              offsetHours = parseInt(match[2], 10) * sign;
              offsetMinutes = parseInt(match[3], 10) * sign;
            }
          }

          partyDateTime = new Date(
            Date.UTC(year, month - 1, day, hour, minute, 0)
          );
          partyDateTime.setUTCHours(partyDateTime.getUTCHours() - offsetHours);
          partyDateTime.setUTCMinutes(
            partyDateTime.getUTCMinutes() - offsetMinutes
          );
        } else {
          partyDateTime = new Date(party.createdAt);
        }

        const hoursDiff = (now - partyDateTime) / (1000 * 60 * 60);

        if (hoursDiff >= deleteAfterHours) {
          await RaidParties.deleteOne({ _id: party._id });
          logger.success(
            `[Party Cleanup] Deleted party ${party._id} (${party.raidName})`
          );

          try {
            const channel = await client.channels.fetch(party.channelId);
            const message = await channel.messages.fetch(party.messageId);
            if (message) await message.delete();
          } catch (err) {
            // Ignore missing channel/message errors
          }
        }
      }
    } catch (err) {
      logger.error("[Party Cleanup] Error:", err);
    }
  });

  logger.success("🧹 Party cleanup scheduler started (runs every hour)");
}

module.exports = { startPartyCleanupScheduler };
