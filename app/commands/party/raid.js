const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const RaidParties = require("../../models/RaidParties");
const { appEmojis } = require("../../utilities/cacheAppEmojis");
const normalizeName = require("../../utilities/normalizeName");
const GuildModule = require("../../models/GuildModule");

// Load raids safely
let raids = [];
try {
  const raidsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../config/raids.json"), "utf8")
  );
  raids = Array.isArray(raidsData) ? raidsData : raidsData.raids || [];
} catch (error) {
  console.error("Failed to load raids.json:", error);
  raids = ["RIN: IZCORGIKY"]; // Fallback
}

async function PartyRaidFinder(interaction) {
 const raidName = interaction.options.getString("raid");
      const date = interaction.options.getString("date");
      const time = interaction.options.getString("time");
      const utc = interaction.options.getString("utc");

      const { embed: validationEmbed, unix } = await validateRaidInput(
        date,
        time,
        utc
      );

      if (validationEmbed) {
        return await safeReply(interaction, {
          embeds: [validationEmbed],
          ephemeral: true,
        });
      }

      let whenField = "No date/time specified";

      if (unix) {
        whenField = `<t:${unix}:F> (<t:${unix}:R>)`;
      }

      let raidSettings;
      try {
        raidSettings = await GuildModule.findOne({
          guildId: interaction.guildId,
          moduleId: "party_raid",
        });
        if (!raidSettings) {
          const embed = new EmbedBuilder()
            .setTitle("Settings Error")
            .setDescription(
              "Could not find Raid Party Finder settings, please contact the administrator."
            )
            .setColor("Red");

          return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if(!raidSettings.enabled) {
          const embed = new EmbedBuilder()
            .setTitle("Settings Error")
            .setDescription(
              "This command has not been enabled, please contact the administrator."
            )
            .setColor("Red");

          return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        logger.error(error);
        const embed = new EmbedBuilder()
          .setTitle("Settings Error")
          .setDescription(
            "Could not fetch Raid Party Finder settings, please contact the administrator."
          )
          .setColor("Red");

        return await safeReply({ embeds: [embed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`⚔️ Raid Party Finder - ${raidName}`)
        .setDescription("Click a role button below to join the party!")
        .addFields(
          { name: "🗓️ Date & Time", value: whenField, inline: false },
          { name: "🛡️ Tanks (0/4)", value: "No one yet", inline: false },
          { name: "💚 Healers (0/4)", value: "No one yet", inline: false },
          { name: "⚔️ DPS (0/12)", value: "No one yet", inline: false }
        )
        .setFooter({ text: "Party created by " + interaction.user.tag })
        .setTimestamp();

      // Create role selection buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("raid_role_tank")
          .setLabel("TANK")
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("raid_role_healer")
          .setLabel("HEALER")
          .setEmoji("💚")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("raid_role_dps")
          .setLabel("DPS")
          .setEmoji("⚔️")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("raid_leave_party")
          .setLabel("Leave Party")
          .setEmoji("❌")
          .setStyle(ButtonStyle.Secondary)
      );

      let content;
      if (raidSettings.enabled) {
        content = `<@&${raidSettings.settings.roleId}>`;
      } else {
        content = "";
      }
      const message = await sendOrFetchReply(interaction, {
        content: content,
        embeds: [embed],
        components: [row],
        ephemeral: false,
      });

      // Store party data
      const party = await RaidParties.create({
        guildId: interaction.guildId,
        raidName,
        tanks: [],
        healers: [],
        dps: [],
        messageId: message.id,
        channelId: interaction.channelId,
        createdBy: interaction.user.id,
        date: date || null,
        time: time || null,
        utc: utc || null,
      });

      await party.save();
}

  async function autocompleteRaid(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      const focusedValue = focusedOption.value;
      const optionName = focusedOption.name;

      let choices = [];

      if (optionName === "raid") {
        // ✅ Show raids list
        choices = raids.map((raid) => ({ name: raid, value: raid }));
      } else if (optionName === "utc") {
        // ✅ Show UTC time zones
        const utcOffsets = [
          "UTC−12:00",
          "UTC−11:00",
          "UTC−10:00",
          "UTC−09:00",
          "UTC−08:00",
          "UTC−07:00",
          "UTC−06:00",
          "UTC−05:00",
          "UTC−04:00",
          "UTC−03:00",
          "UTC−02:00",
          "UTC−01:00",
          "UTC±00:00",
          "UTC+01:00",
          "UTC+02:00",
          "UTC+03:00",
          "UTC+04:00",
          "UTC+05:00",
          "UTC+06:00",
          "UTC+07:00",
          "UTC+08:00",
          "UTC+09:00",
          "UTC+10:00",
          "UTC+11:00",
          "UTC+12:00",
        ];
        choices = utcOffsets.map((offset) => ({ name: offset, value: offset }));
      }

      const filtered = choices.filter((choice) =>
        choice.name.toLowerCase().includes(focusedValue.toLowerCase())
      );

      await interaction.respond(filtered.slice(0, 25));
    } catch (error) {
      console.error("Autocomplete error:", error);
      try {
        await interaction.respond([]);
      } catch (e) {
        console.error("Failed to send empty response:", e);
      }
    }
  }

    async function handleButtonRaid(interaction) {
    // Find which party this button belongs to
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 50 });

    for (const [msgId, msg] of messages) {
      const party = await RaidParties.findOne({ messageId: msgId });
      if (party) {
        await handleInteraction(interaction, msgId);
        return;
      }
    }

    const partyEmbedError = new EmbedBuilder()
      .setTitle("Party Finder")
      .setDescription("Could not find the party for this button.")
      .setColor("Red");

    await safeReply(interaction, {
      embeds: [partyEmbedError],
      ephemeral: true,
    });
  }

async function handleInteraction(interaction, partyMessageId) {
  // Defer the reply to give yourself time to fetch from DB
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
  }

  const party = await RaidParties.findOne({ messageId: partyMessageId });
  if (!party) {
    const partyEmbedError = new EmbedBuilder()
      .setTitle("Party Finder")
      .setDescription("This party finder has expired.")
      .setColor("Red");

    // Use editReply instead of reply if already deferred
    return await interaction.editReply({
      embeds: [partyEmbedError],
    });
  }

  const customId = interaction.customId;

  if (customId.includes("leave_party")) {
    await leaveParty(interaction, partyMessageId);
  }

  // Role selection
  if (customId.includes("role_")  && !customId.includes("back_")) {
    const role = customId.split("_")[2];
    await showClassSelection(interaction, role, partyMessageId);
  }
  // Class selection
  else if (customId.includes("class_") && !customId.includes("back_")) {
    const [_, commandName, role, className] = customId.split("_");
    await showSpecSelection(interaction, role, className, partyMessageId);
  }
  // Spec selection
  else if (customId.includes("spec_")  && !customId.includes("back_")) {
    const parts = customId.split("_");
    const role = parts[2];
    const className = parts[3];
    const spec = parts.slice(3).join(" ");
    await addToParty(interaction, role, className, spec, partyMessageId);
  }
  // Back button
  else if (customId.includes("back_")) {
    const target = customId.split("_")[2];
    if (target === "role") {
      await showRoleSelection(interaction, partyMessageId);
    } else if (target.includes("class")) {
      const role = customId.split("_")[3];
      await showClassSelection(interaction, role, partyMessageId);
    }
  }
}

async function safeReply(interaction, messageOptions) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(messageOptions);
    } else {
      return await interaction.reply(messageOptions);
    }
  } catch (error) {
    console.error("safeReply error:", error);
  }
}

// Helper to ensure we always get the message
async function sendOrFetchReply(interaction, options) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      // Defer first to avoid reply errors
      await interaction.deferReply({ ephemeral: options.ephemeral ?? true });
    }

    // Edit the deferred reply
    await interaction.editReply(options);

    // Fetch the resulting message
    const message = await interaction.fetchReply();
    return message;
  } catch (err) {
    console.error("sendOrFetchReply error:", err);
    throw err;
  }
}

async function showRoleSelection(interaction, partyMessageId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("raid_role_tank")
      .setLabel("TANK")
      .setEmoji("🛡️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("raid_role_healer")
      .setLabel("HEALER")
      .setEmoji("💚")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("raid_role_dps")
      .setLabel("DPS")
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Danger)
  );

  const roleEmbed = new EmbedBuilder()
    .setTitle("Party Finder")
    .setDescription("Choose your role:")
    .setColor("Red");

  await safeReply(interaction, {
    embeds: [roleEmbed],
    components: [row],
    ephemeral: true,
  });
}

async function showClassSelection(interaction, role, partyMessageId) {
  const classes = {
    tank: ["Heavy Guardian", "Shield Knight"],
    healer: ["Verdant Oracle", "Beat Performer"],
    dps: ["Stormblade", "Wind Knight", "Frost Mage", "Marksman"],
  };

  const buttons = classes[role].map((className) => {
    const emoji = appEmojis.get(normalizeName(className)) || undefined;

    return new ButtonBuilder()
      .setCustomId(`raid_class_${role}_${className.replace(" ", "")}`)
      .setLabel(className)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emoji); // assign emoji here
  });

  // Split into rows of 4 buttons max
  const rows = [];
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 4)));
  }

  const embed = new EmbedBuilder()
    .setTitle("Party Finder")
    .setDescription("Choose your class:")
    .setColor("Green");

  await safeReply(interaction, {
    embeds: [embed],
    components: rows,
    ephemeral: true,
  });
}

async function showSpecSelection(interaction, role, className, partyMessageId) {
  const specs = {
    HeavyGuardian: ["Earthfort", "Block"],
    ShieldKnight: ["Shield", "Recovery"],
    VerdantOracle: ["Lifebind", "Smite"],
    BeatPerformer: ["Concerto", "Dissonance"],
    Stormblade: ["Iaido Slash", "Moonstrike"],
    WindKnight: ["Skyward", "Vanguard"],
    FrostMage: ["Icicle", "Frostbeam"],
    Marksman: ["Wildpack", "Falconry"],
  };

  const classKey = className.replace(" ", "");
  const specButtons = specs[classKey].map((spec) => {
    const emoji = appEmojis.get(normalizeName(spec)) || undefined;

    return new ButtonBuilder()
      .setCustomId(`raid_spec_${role}_${classKey}_${spec}`)
      .setLabel(spec)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(emoji); // assign emoji here
  });

  const backButton = new ButtonBuilder()
    .setCustomId(`raid_back_class_${role}`)
    .setLabel("Back")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(...specButtons, backButton);

  const embed = new EmbedBuilder()
    .setTitle("Party Finder")
    .setDescription(`Choose your ${className} spec:`)
    .setColor("Green");

  await safeReply(interaction, {
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}

async function addToParty(interaction, role, className, spec, partyMessageId) {
  const party = await RaidParties.findOne({ messageId: partyMessageId });
  const userId = interaction.user.id;

  // Check if user is already in party or bench
  const allMembers = [
    ...party.tanks,
    ...party.healers,
    ...party.dps,
    ...party.bench.tanks,
    ...party.bench.healers,
    ...party.bench.dps,
  ];
  if (allMembers.some((m) => m.userId === userId)) {
    return await safeReply(interaction, {
      embeds: [
        new EmbedBuilder()
          .setTitle("Party Finder")
          .setDescription("❌ You're already in this party or on the bench!")
          .setColor("Red"),
      ],
      ephemeral: true,
    });
  }

  const maxSlots = { tanks: 4, healers: 4, dps: 12 };
  const roleKey = role.toLowerCase() === "dps" ? "dps" : role + "s";

  const rangeMap = {
    "Iaido Slash": "Melee",
    Moonstrike: "Melee",
    Skyward: "Melee",
    Vanguard: "Melee",
    Icicle: "Ranged",
    Frostbeam: "Ranged",
    Wildpack: "Ranged",
    Falconry: "Ranged",
    Earthfort: "Melee",
    Block: "Melee",
    Shield: "Melee",
    Recovery: "Melee",
    Lifebind: "Melee",
    Smite: "Ranged",
    Concerto: "Ranged",
    Dissonance: "Melee",
  };

  const member = {
    userId,
    username: interaction.user.username,
    class: className.replace(/([A-Z])/g, " $1").trim(),
    spec,
    range: rangeMap[spec] || "Unknown",
  };

  // If party is full, add to bench instead
  if (party[roleKey].length >= maxSlots[roleKey]) {
    const queueSpot = party.bench[roleKey].length + 1;
    const benchMember = { ...member, queueSpot };
    party.bench[roleKey].push(benchMember);
    await party.save();

    await updatePartyEmbed(interaction, party);

    const embed = new EmbedBuilder()
      .setTitle("Party Finder")
      .setDescription(
        `🪑 The ${role} role is full, so you've been added to the bench!\nYou are **#${queueSpot}** in the queue.`
      )
      .setColor("Yellow");

    return await safeReply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  }

  // Otherwise, add to main party
  party[roleKey].push(member);
  await party.save();

  await updatePartyEmbed(interaction, party);

  const embed = new EmbedBuilder()
    .setTitle("Party Finder")
    .setDescription(
      `✅ Added to party as ${member.class} - ${spec} (${member.range})`
    )
    .setColor("Green");

  return await safeReply(interaction, {
    embeds: [embed],
    ephemeral: true,
  });
}

async function leaveParty(interaction, partyMessageId) {
  const userId = interaction.user.id;

  const party = await RaidParties.findOne({ messageId: partyMessageId });
  if (!party) {
    return safeReply(interaction, {
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Party Not Found")
          .setDescription("This party no longer exists or has already ended."),
      ],
      ephemeral: true,
    });
  }

  const roles = ["tanks", "healers", "dps"];
  let removedFromRole = null;
  let removedFromBench = false;

  // Try to remove the user from main roster first
  for (const role of roles) {
    const index = party[role].findIndex((m) => m.userId === userId);
    if (index !== -1) {
      party[role].splice(index, 1);
      removedFromRole = role;
      break;
    }
  }

  // If not found in main roster, check the bench
  if (!removedFromRole) {
    for (const role of roles) {
      const benchIndex = party.bench[role].findIndex(
        (m) => m.userId === userId
      );
      if (benchIndex !== -1) {
        party.bench[role].splice(benchIndex, 1);
        removedFromBench = true;
        break;
      }
    }
  }

  // If not found anywhere
  if (!removedFromRole && !removedFromBench) {
    return safeReply(interaction, {
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ You Are Not In This Party")
          .setDescription("You can't leave a party you are not part of."),
      ],
      ephemeral: true,
    });
  }

  // If someone left from the main roster, pull in first from bench (if available)
  if (removedFromRole && party.bench[removedFromRole].length > 0) {
    // Get first in queue
    const nextMember = party.bench[removedFromRole].shift();

    // Add them to main roster
    party[removedFromRole].push(nextMember);

    // Let them know they got promoted
    try {
      const user = await interaction.client.users.fetch(nextMember.userId);

      const embed = new EmbedBuilder()
        .setTitle("Raid Finder")
        .setDescription(
          `🎉 You’ve been promoted from the bench to the main party as a **${nextMember.class} - ${nextMember.spec} (${nextMember.range})** for **${party.raidName}**!`
        )
        .setColor("Green");
      await user.send({ embeds: [embed] });
    } catch (err) {
      console.log("Could not DM promoted user:", err.message);
    }
  }

  await party.save();
  await updatePartyEmbed(interaction, party);

  // Confirm to the leaver
  return safeReply(interaction, {
    embeds: [
      new EmbedBuilder()
        .setColor("#57f287")
        .setTitle("✅ You Left The Party")
        .setDescription(
          removedFromBench
            ? "You have been removed from the bench."
            : "You have been removed from the party successfully."
        ),
    ],
    ephemeral: true,
  });
}

async function updatePartyEmbed(interaction, party) {
  const channel = await interaction.client.channels.fetch(party.channelId);
  const message = await channel.messages.fetch(party.messageId);

  const formatMembers = (members) => {
    if (!members || members.length === 0) return "No one yet";

    return members
      .map((m) => {
        // Try to get class/spec emojis
        const classEmoji = appEmojis.get(normalizeName(m.class)) || "";
        const specEmoji = appEmojis.get(normalizeName(m.spec)) || "";

        return ` <@${m.userId}> - ${classEmoji} ${m.class} (${specEmoji} ${m.spec}) - ${m.range}`;
      })
      .join("\n");
  };

  const formatBench = (members) => {
    return members
      .map((m) => {
        const classEmoji = appEmojis.get(m.class.toLowerCase()) || "";
        const specEmoji = appEmojis.get(m.spec.toLowerCase()) || "";
        return `#${m.queueSpot} - <@${m.userId}> - ${classEmoji} ${m.class} (${specEmoji} ${m.spec}) - ${m.range}`;
      })
      .join("\n");
  };

  const { embed: validationEmbed, unix } = await validateRaidInput(
    party.date,
    party.time,
    party.utc
  );

  if (validationEmbed) {
    return await safeReply(interaction, {
      embeds: [validationEmbed],
      ephemeral: true,
    });
  }

  let whenField = "No date/time specified";
  if (unix) whenField = `<t:${unix}:F> (<t:${unix}:R>)`;

  // Build bench lines dynamically
  const benchSections = [];
  if (party.bench.tanks.length > 0)
    benchSections.push(`**Tanks:**\n${formatBench(party.bench.tanks)}`);
  if (party.bench.healers.length > 0)
    benchSections.push(`**Healers:**\n${formatBench(party.bench.healers)}`);
  if (party.bench.dps.length > 0)
    benchSections.push(`**DPS:**\n${formatBench(party.bench.dps)}`);

  const embedFields = [
    { name: "🗓️ Date & Time", value: whenField, inline: false },
    {
      name: `🛡️ Tanks (${party.tanks.length}/4)`,
      value: formatMembers(party.tanks),
      inline: false,
    },
    {
      name: `💚 Healers (${party.healers.length}/4)`,
      value: formatMembers(party.healers),
      inline: false,
    },
    {
      name: `⚔️ DPS (${party.dps.length}/12)`,
      value: formatMembers(party.dps),
      inline: false,
    },
  ];

  // Only add bench section if there are bench members
  if (benchSections.length > 0) {
    embedFields.push({
      name: "🪑 Bench",
      value: benchSections.join("\n\n"),
      inline: false,
    });
  }

  const embed = EmbedBuilder.from(message.embeds[0]).setFields(embedFields);

  await message.edit({ embeds: [embed] });
}

async function validateRaidInput(date, time, utc) {
  // --- 🟢 Case 1: All three are empty → skip validation entirely ---
  if (!date && !time && !utc) {
    return { embed: null, unix: null };
  }

  // --- 🔴 Case 2: Some fields provided, but not all three ---
  if (
    (date && (!time || !utc)) ||
    (time && (!date || !utc)) ||
    (utc && (!date || !time))
  ) {
    return {
      embed: new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Missing Information")
        .setDescription(
          "To schedule a raid, you must provide **date**, **time**, and **UTC offset** together.\n\nExample:\n`/party raid raid:<name> date:15/10 time:18:30 utc:UTC+2`"
        ),
    };
  }

  // --- ✅ Case 3: All three provided — validate formats ---
  const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])$/;
  if (!dateRegex.test(date)) {
    return {
      embed: new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Invalid Date Format")
        .setDescription("Please use **DD/MM** format (e.g. `15/10`)."),
    };
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    return {
      embed: new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Invalid Time Format")
        .setDescription(
          "Please use **HH:MM** in 24-hour format (e.g. `18:30`)."
        ),
    };
  }

  // --- ✅ Compute event timestamp ---
  const { unix, error } = computeEventUnixTimestamp(date, time, utc);

  if (!unix) {
    return {
      embed: new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Invalid Date/Time")
        .setDescription(error || "Unable to calculate event time."),
    };
  }

  // --- 🟢 Valid ---
  return { embed: null, unix };
}

/**
 * Compute Unix timestamp (in seconds) for an event given local date/time and a UTC specifier.
 * - date: "DD/MM"
 * - time: "HH:MM"
 * - utc: "UTC+02:00" or "UTC+2" or IANA zone like "Europe/Brussels"
 *
 * Returns { unix: number, error: string|null }
 */
function computeEventUnixTimestamp(date, time, utc) {
  // sanitize
  date = (date || "").trim();
  time = (time || "").trim();
  utc = (utc || "").trim();

  // basic validations (you likely already validated these earlier)
  const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])$/;
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!dateRegex.test(date)) return { unix: null, error: "Invalid date" };
  if (!timeRegex.test(time)) return { unix: null, error: "Invalid time" };

  const [day, month] = date.split("/").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  let year = now.getUTCFullYear();

  // Initial wall-clock UTC
  let wallClockUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0);

  // If this is in the past, assume next year
  if (wallClockUtcMs < now.getTime()) {
    year += 1;
    wallClockUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0);
  }

  // Helper: parse "UTC±HH[:MM]" -> offsetMinutes
  function parseUTCOffsetString(str) {
    // Accept "UTC", "UTC+2", "UTC+02:00", "UTC-0530", "UTC+05:30"
    const m = str.match(/^UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    const hh = parseInt(m[2], 10);
    const mm = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hh * 60 + mm);
  }

  // Helper: try to compute offset minutes for IANA timezone using Intl
  // We calculate the difference between the wallClockUtcMs and the zone-local interpretation
  function getOffsetMinutesForIana(timeZone, utcMsForWallClock) {
    try {
      // Format the UTC-based Date into the target zone's local parts
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // dtf.formatToParts returns the zone's representation of the same instant.
      // We need the zone representation that corresponds to the same wall-clock components.
      // To compute offset for a wall-clock time, we will format the JS Date produced by
      // treating the wall-clock as UTC (utcMsForWallClock) into the target timezone, then
      // reconstruct a UTC ms from those parts (which yields what that wall clock would be
      // interpreted as UTC in that timezone). The difference is the offset.
      const parts = dtf.formatToParts(new Date(utcMsForWallClock));
      const map = {};
      for (const p of parts) map[p.type] = p.value;
      if (!map.year || !map.month || !map.day || !map.hour || !map.minute)
        return null;

      const y = parseInt(map.year, 10);
      const mo = parseInt(map.month, 10);
      const d = parseInt(map.day, 10);
      const h = parseInt(map.hour, 10);
      const min = parseInt(map.minute, 10);
      const sec = map.second ? parseInt(map.second, 10) : 0;

      // The wall-clock in that zone corresponds to a UTC ms equal to Date.UTC(y, mo-1, d, h, min, sec)
      const zoneInterpretedUtcMs = Date.UTC(y, mo - 1, d, h, min, sec);

      // The difference (zoneInterpretedUtcMs - utcMsForWallClock) is the offset we need to apply.
      const offsetMinutes = Math.round(
        (zoneInterpretedUtcMs - utcMsForWallClock) / 60000
      );
      return offsetMinutes;
    } catch (err) {
      return null;
    }
  }

  let offsetMinutes = null;

  // If utc string starts with "UTC"
  if (/^UTC/i.test(utc)) {
    offsetMinutes = parseUTCOffsetString(utc);
  } else if (utc) {
    // Assume IANA zone
    offsetMinutes = getOffsetMinutesForIana(utc, wallClockUtcMs);
  }

  // If we couldn't parse offset, fallback to 0 (i.e., treat provided time as UTC)
  if (offsetMinutes === null) {
    // Optionally return an error if you prefer strict behaviour:
    // return { unix: null, error: "Unknown timezone/UTC format" };
    offsetMinutes = 0;
  }

  // If user provided local time in timezone with offset `offsetMinutes`,
  // then the true UTC ms = wallClockUtcMs - offsetMinutes*60*1000
  const actualEventUtcMs = wallClockUtcMs - offsetMinutes * 60000;

  // Make sure it's a valid date
  const eventDate = new Date(actualEventUtcMs);
  if (isNaN(eventDate.getTime())) {
    return { unix: null, error: "Computed invalid date" };
  }

  // Optionally check that it is in the future
  const nowMs = Date.now();
  if (actualEventUtcMs < nowMs) {
    // You could return a special code or error here
    return { unix: Math.floor(actualEventUtcMs / 1000), error: "past" };
  }

  return { unix: Math.floor(actualEventUtcMs / 1000), error: null };
}


module.exports = {PartyRaidFinder, autocompleteRaid, handleButtonRaid};