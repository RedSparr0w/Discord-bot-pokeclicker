const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'poke-crew',
  aliases     : [],
  description : 'Apply the @Poké Crew role to a user',
  args        : [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'User to apply the role to',
      required: true,
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

    const role = member.guild.roles.cache.find(role => role.name === 'Poké Crew');

    if (!role) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Poké Crew role not found,\ntry again later..');
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

    const output = [`Welcome ${member},\nCongratulations on ${role}!`];

    await member.roles.add(role, `Role applied by ${interaction.member.displayName}-${interaction.user.id}`);

    const embed = new EmbedBuilder().setColor('#3498db').setDescription(output.join('\n'));

    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()}
      **Action:** Applied ${role}`);

    interaction.reply({ embeds: [embed] });
  },
};
