const cron = require("node-cron");
const RaidParties = require("../models/RaidParties");
const GuildModule = require("../models/GuildModule");

async function startPartyCleanupScheduler(client) {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const parties = await RaidParties.find();
      const guildModules = await GuildModule.find({ moduleId: "party_raid" });

      for (const party of parties) {
        const guildModule = guildModules.find(
          (m) => m.guildId === party.guildId
        );

        const deleteAfterHours =
          guildModule &&
          guildModule.enabled &&
          guildModule.settings?.deleteAfter
            ? guildModule.settings.deleteAfter
            : 24;

        let partyDateTime;

        if (party.date && party.time) {
          const [day, month] = party.date.split("/").map(Number);
          const [hour, minute] = party.time.split(":").map(Number);
          const currentYear = now.getUTCFullYear();

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

          // Create the party datetime in the user's timezone
          partyDateTime = new Date(
            Date.UTC(currentYear, month - 1, day, hour, minute, 0)
          );

          // Convert from user's timezone to UTC
          partyDateTime.setUTCHours(partyDateTime.getUTCHours() - offsetHours);
          partyDateTime.setUTCMinutes(
            partyDateTime.getUTCMinutes() - offsetMinutes
          );

          // If the date/time is in the past for this year, try next year
          if (partyDateTime < now) {
            partyDateTime = new Date(
              Date.UTC(currentYear + 1, month - 1, day, hour, minute, 0)
            );
            partyDateTime.setUTCHours(
              partyDateTime.getUTCHours() - offsetHours
            );
            partyDateTime.setUTCMinutes(
              partyDateTime.getUTCMinutes() - offsetMinutes
            );
          }
        } else {
          // Fallback to creation date if no date/time specified
          partyDateTime = new Date(party.createdAt);
        }

        // Only delete if the party time has PASSED and enough hours have elapsed since then
        const hoursSinceParty = (now - partyDateTime) / (1000 * 60 * 60);

        // Only delete if:
        // 1. The party time has passed (hoursSinceParty > 0)
        // 2. Enough time has elapsed since the party (hoursSinceParty >= deleteAfterHours)
        if (hoursSinceParty >= deleteAfterHours) {
          await RaidParties.deleteOne({ _id: party._id });
          logger.success(
            `[Party Cleanup] Deleted party ${party._id} (${
              party.raidName
            }) - ${hoursSinceParty.toFixed(1)} hours after party time`
          );

          try {
            const channel = await client.channels.fetch(party.channelId);
            const message = await channel.messages.fetch(party.messageId);
            if (message) await message.delete();
          } catch {
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
