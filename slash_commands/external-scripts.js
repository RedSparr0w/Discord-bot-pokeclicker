const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'external-scripts',
  aliases     : ['scripting','scripter','scripts'],
  description : 'Apply the @external scripts role to a user',
  args        : [
    {
      name: 'add',
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Add the role to a user',
      options: [
        {
          name: 'user',
          type: ApplicationCommandOptionType.User,
          description: 'User to add the role to',
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Remove the role from a user',
      options: [
        {
          name: 'user',
          type: ApplicationCommandOptionType.User,
          description: 'User to remove the role from',
          required: true,
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks', 'ManageRoles'],
  userroles   : ['Moderator'],
  execute     : async (interaction, args) => {
    const id = interaction.options.get('user').value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const role = member.guild.roles.cache.find(role => role.name === 'external scripts');

    if (!role) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('external scripts role not found,\ntry again later..');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member == interaction.guild.members.me) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to apply ${role} to the bot`);
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('You cannot apply that role to me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    // remove the external scripts role from someone
    if (subcommand === 'add') {
      const output = [`${role} applied to ${member}!`];

      await member.roles.add(role, `Role applied by ${interaction.member.displayName}-${interaction.user.id}`);

      const embed = new EmbedBuilder().setColor('#3498db').setDescription(output.join('\n'));

      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Applied ${role}`);

      return interaction.reply({ embeds: [embed] });
    }

    // remove the external scripts role from someone
    if (subcommand === 'remove') {
      const output = [`${role} removed from ${member}!`];

      await member.roles.remove(role, `Role removed by ${interaction.member.displayName}-${interaction.user.id}`);

      const embed = new EmbedBuilder().setColor('#3498db').setDescription(output.join('\n'));

      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Removed  ${role}`);

      return interaction.reply({ embeds: [embed] });
    }
  },
};
