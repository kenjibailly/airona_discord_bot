require("dotenv/config");
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

async function deployCommands(guildId) {
  const commands = [];

  // Load all command files from the "commands" folder
  const commandsPath = path.join(__dirname + "/commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js") && file !== "deploy-commands.js");

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    // Each command exports { data, execute }
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, guildId),
      { body: commands }
    );

    logger.success("Successfully reloaded application (/) commands.");
  } catch (error) {
    logger.error(error);
  }
}

module.exports = deployCommands;
