const cron = require("node-cron");
const RaidParties = require("../models/RaidParties");

function startPartyCleanupScheduler(client) {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const parties = await RaidParties.find();

      for (const party of parties) {
        let partyDateTime;

        if (party.date && party.time) {
          const [day, month] = party.date.split("/").map(Number);
          const [hour, minute] = party.time.split(":").map(Number);
          const year = now.getUTCFullYear();

          // Parse UTC offset, e.g., "UTC−12:00" or "UTC+03:30"
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

          // Build UTC date, then adjust by offset
          partyDateTime = new Date(
            Date.UTC(year, month - 1, day, hour, minute, 0)
          );

          // Convert local time (with offset) to UTC
          partyDateTime.setUTCHours(partyDateTime.getUTCHours() - offsetHours);
          partyDateTime.setUTCMinutes(
            partyDateTime.getUTCMinutes() - offsetMinutes
          );
        } else {
          partyDateTime = new Date(party.createdAt);
        }

        const hoursDiff = (now - partyDateTime) / (1000 * 60 * 60);

        if (hoursDiff >= 24) {
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

  logger.success(
    "🧹 Party cleanup scheduler started (runs every 10 seconds for testing)"
  );
}

module.exports = { startPartyCleanupScheduler };
