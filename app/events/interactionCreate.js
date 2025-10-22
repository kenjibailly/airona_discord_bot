const { Events } = require("discord.js");
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle autocomplete FIRST
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
      return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
      console.log("Button clicked:", interaction.customId);
      // Find the party command to handle button interactions
      const partyCommand = interaction.client.commands.get("party");
      if (partyCommand && partyCommand.handleButton) {
        try {
          await partyCommand.handleButton(interaction);
        } catch (error) {
          console.error("Button interaction error:", error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: "There was an error processing your selection!",
              ephemeral: true,
            });
          }
        }
      }
      return;
    }

    // Then handle commands
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
