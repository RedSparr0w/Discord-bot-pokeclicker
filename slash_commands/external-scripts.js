const { MessageEmbed } = require('discord.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'external-scripts',
  aliases     : ['scripting','scripter','scripts'],
  description : 'Apply the @external scripts role to a user',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'User to apply the role to',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
  userroles   : ['Moderator'],
  execute     : async (interaction, args) => {
    const id = interaction.options.get('user').value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const role = member.guild.roles.cache.find(role => role.name === 'external scripts');

    if (!role) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('external scripts role not found,\ntry again later..');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member == interaction.guild.me) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to apply ${role} to the bot`);
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('You cannot apply that role to me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const output = [`${role} applied to ${member}!`];

    await member.roles.add(role, `Role applied by ${interaction.member.displayName}-${interaction.user.id}`);

    const embed = new MessageEmbed().setColor('#3498db').setDescription(output.join('\n'));

    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()}
      **Action:** Applied ${role}`);

    interaction.reply({ embeds: [embed] });
  },
};
