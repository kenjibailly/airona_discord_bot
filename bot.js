require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Utilities
const botJoinsGuild = require("./bot_joins_guild");
const Logger = require("./utilities/logger.js");
global.logger = new Logger("Bot");

// MongoDB connection
const mongodb_URI = require("./mongodb/URI");
const memberJoinsGuild = require("./member_joins_guild.js");
mongoose
  .connect(mongodb_URI)
  .then(() => logger.success("DB connected!"))
  .catch((err) => logger.error(err));

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "name" in command.data) {
    client.commands.set(command.data.name, command);
  } else {
    logger.warn(
      `[WARNING] The command at ${file} is missing a required "data" or "name" property.`
    );
  }
}

// Command interaction handling
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
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
});

// Bot ready
client.once("clientReady", () => {
  logger.success(`Logged in as ${client.user.tag}!`);
});

// Guild join
client.on("guildCreate", async (guild) => {
  botJoinsGuild(client, guild);
});

// Member join - Auto Role & Welcome Message
client.on("guildMemberAdd", async (member) => {
  const guildId = member.guild.id;

  memberJoinsGuild(member, guildId);
});

// Login Discord
client.login(process.env.DISCORD_TOKEN);
