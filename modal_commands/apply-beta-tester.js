const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { DAY } = require('../helpers.js');
const { getStatistic } = require('../database.js');

module.exports = {
  name        : 'apply-beta-tester',
  aliases     : [],
  description : 'Apply for the Beta Tester role',
  args        : [],
  guildOnly   : true,
  cooldown    : DAY / 1000,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    const member = interaction.member;
    const user = member.user;

    const joinDiscord = new Date(user.createdTimestamp);
    const joinServer = new Date(member.joinedTimestamp);
    const today = new Date();

    // Auto decline if member is new to the server (< 14 days)
    // TODO: maybe enable this at some point
    if (false && today - joinServer < 14 * DAY) {
      interaction.reply({ content: 'Please apply again later once you have been in the server for at least 2 weeks', ephemeral: true });
      return;
    }

    // Auto accept if member of server for more than 1 year
    // TODO: maybe enable this at some point
    if (false && today - joinServer > 365 * DAY) {
      const role = interaction.guild.roles.cache.find(r => r.name === 'Beta Tester');
      if (!role) return;

      member.roles.add(role);
      interaction.reply({ content: 'Welcome!\nYou are now a beta tester.', ephemeral: true });
      return;
    }

    // Send user to approval queue
    const warnings = await getStatistic(user, 'warnings');
    const messages = await getStatistic(user, 'messages');
    const reason = interaction.fields.getTextInputValue('apply-beta-tester-reason');

    const embed = new EmbedBuilder()
      .setAuthor({
        name: user.tag,
        url: `https://discordapp.com/users/${user.id}`,
        iconURL: user.displayAvatarURL(),
      })
      .setDescription(user.toString())
      .setColor('#3498db')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        {
          name: 'Joined Discord:',
          value: `<t:${Math.floor(+joinDiscord / 1000)}:R>`,
          inline: true,
        },
        {
          name: 'Joined Server:',
          value: `<t:${Math.floor(+joinServer / 1000)}:R>`,
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: 'Warnings:',
          value: warnings?.toLocaleString() || 'unknown',
          inline: true,
        },
        {
          name: 'Message count:',
          value: messages?.toLocaleString() || 'unknown',
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: 'Roles:',
          value: member?.roles?.cache?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => `${r}`)?.join('\n') || 'unknown',
          inline: false,
        },
        {
          name: 'Reason:',
          value: ['```', reason.replace(/```/g, ''), '```'].join('\n') || 'unknown',
          inline: false,
        }
      )
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();

    const buttons = new ActionRowBuilder();
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId('approve-beta-tester')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
        .setEmoji('☑️'),
      new ButtonBuilder()
        .setCustomId('decline-beta-tester')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger),
    );

    interaction.guild.channels.cache.find(c => c.name === 'approval-queue')?.send({ embeds: [embed], components: [buttons] });
    
    interaction.reply({ embeds: [new EmbedBuilder().setColor('#2ecc71').setDescription('Your application has been submitted for review!')], ephemeral: true });
    return;
  },
};
