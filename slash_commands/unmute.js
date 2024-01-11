const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { mutedRoleID } = require('../config.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  type        : ApplicationCommandType.User,
  name        : 'unmute',
  aliases     : [],
  description : 'Remove the @Muted role from users',
  args        : [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'User to unmute',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userroles   : ['Moderator'],
  execute     : async (interaction, args) => {
    const id = interaction.options.get('user').value;
    const reason = interaction.options.get('reason')?.value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member == interaction.guild.members.me) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to unmute the bot
        **Reason:** ${reason || 'Unknown'}`);
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('You cannot unmute me trainer?!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if user has higher roles than the mod (ignore color-roles)
    if (
      Math.max(...member.roles.cache.filter(r => !r.name.includes('color')).map(r => r.position)) >= Math.max(...interaction.member.roles.cache.filter(r => !r.name.includes('color')).map(r => r.position))
    ) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to unmute user (failed as higher roles)
        **Reason:** ${reason || 'Unknown'}`);
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('The user you tried to unmute has higher or equal roles than you!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const output = [interaction.user, '', 'Unmuted the following user:'];

    await member.roles.remove(mutedRoleID, `User unmuted by ${interaction.member.displayName}-${interaction.user.id}`);
    output.push(member);
    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()}
      **Action:** Unmuted`);

    const embed = new EmbedBuilder().setColor('#3498db').setDescription(output.join('\n'));
    interaction.reply({ embeds: [embed] });
  },
};
