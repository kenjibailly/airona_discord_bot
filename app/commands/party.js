const {
  SlashCommandBuilder
} = require("discord.js");
const {PartyRaidFinder, autocompleteRaid, handleButtonRaid} = require("./party/raid");
const {PartyDungeonFinder, autocompleteDungeon, handleButtonDungeon } = require("./party/dungeon");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("Manage party finder for raids and dungeons")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("raid")
        .setDescription("Create a raid party finder")
        .addStringOption((option) =>
          option
            .setName("raid")
            .setDescription("Which raid is this party for?")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription(
              "When is the raid going to take place? Format: DD/MM"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription(
              "When is the raid going to take place? Format: HH:MM"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("utc")
            .setDescription("What is your time zone?")
            .setRequired(false)
            .setAutocomplete(true)
        )
    )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("dungeon")
      .setDescription("Create a dungeon party finder")
      .addStringOption((option) =>
          option
            .setName("dungeon")
            .setDescription("Which dungeon is this party for?")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) =>
          option
            .setName("date")
            .setDescription(
              "When is the raid going to take place? Format: DD/MM"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("time")
            .setDescription(
              "When is the raid going to take place? Format: HH:MM"
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("utc")
            .setDescription("What is your time zone?")
            .setRequired(false)
            .setAutocomplete(true)
        )
      ),



  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "raid") {
     PartyRaidFinder(interaction);
    }
    if (subcommand === "dungeon") {
     PartyDungeonFinder(interaction);
    }
  },

  async autocomplete(interaction) {
    if(interaction.options._subcommand == "raid") {
      autocompleteRaid(interaction);
    }
    if(interaction.options._subcommand == "dungeon") {
      autocompleteDungeon(interaction);
    }
  },
  async handleButton(interaction) {

    if(interaction.message.interaction?.commandName.endsWith("raid") || interaction.customId.startsWith("raid_")) {
      handleButtonRaid(interaction);
    }

    if(interaction.message.interaction?.commandName.endsWith("dungeon") || interaction.customId.startsWith("dungeon_")) {
      handleButtonDungeon(interaction);
    }
  },
  
};
