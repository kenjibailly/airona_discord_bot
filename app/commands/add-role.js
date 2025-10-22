const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-role")
    .setDescription("Add a role to a user (and remove Visitor if present)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to assign the role to")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to assign to the user")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members.fetch(user.id);

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setTitle("Add Role")
        .setDescription(`❌ You don't have permission to manage roles.`)
        .setColor("Red");
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    try {
      // Remove "Visitor" role if it exists
      const visitorRole = interaction.guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "visitor"
      );

      if (visitorRole && member.roles.cache.has(visitorRole.id)) {
        await member.roles.remove(visitorRole);
      }

      // Add the new role
      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setTitle("Add Role")
        .setDescription(
          `✅ Successfully added <@&${role.id}> to <@${user.id}>.`
        )
        .setColor("Green");

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      logger.error("Error assigning role:", error);
      const embed = new EmbedBuilder()
        .setTitle("Add Role")
        .setDescription(
          `❌ Failed to assign the role. Check my permissions and role hierarchy.`
        )
        .setColor("Red");
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
