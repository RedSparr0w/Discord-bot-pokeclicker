const { EmbedBuilder } = require('discord.js');
const { addStatistic } = require('../database.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'warn',
  aliases     : [],
  description : 'Gives a user a warning.',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to be warned',
      required: true,
    },
    {
      name: 'reason',
      type: 'STRING',
      description: 'The reason this user is being warned',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 30,
  botperms    : ['SendMessages', 'EmbedLinks', 'KickMembers'],
  userroles   : ['Moderator'],
  execute     : async (interaction) => {
    const id = interaction.options.get('user').value;
    const reason = interaction.options.get('reason')?.value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const user = member?.user;

    if (member && member == interaction.guild.members.me) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to warn the bot
        **Reason:** ${reason || 'Unknown'}`);
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('You cannot warn me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const joinDiscord = new Date(user?.createdTimestamp);
    const joinServer = new Date(member?.joinedTimestamp);
    const warnings = await addStatistic(user, 'warnings', 1);

    const embed = new EmbedBuilder()
      .setTitle('USER WARNED')
      .setAuthor({
        name: user?.tag,
        url: `https://discordapp.com/users/${user?.id}`,
        iconURL: user?.displayAvatarURL?.(),
      })
      .setDescription(user?.toString?.())
      .setColor('Random')
      .setThumbnail(user?.displayAvatarURL?.())
      .addFields([
        {
          name: 'Warnings:',
          value: warnings?.toString() || 'unknown',
        },
        {
          name: 'Status:',
          value: member?.presence?.status || 'offline',
        },
        {
          name: 'Joined Discord:',
          value: `<t:${Math.floor(+joinDiscord / 1000)}:R>`,
        },
        {
          name: 'Joined Server:',
          value: `<t:${Math.floor(+joinServer / 1000)}:R>`,
        },
      ])
      .setFooter({ text: `ID: ${user?.id}` })
      .setTimestamp();

    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member?.toString?.() || user?.toString?.() || id}
      **Action:** User Warned
      **Reason:** ${reason || 'Unknown'}
      **Warnings:** ${warnings || 'unknown'}`);

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
