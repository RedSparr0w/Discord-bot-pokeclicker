const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { DAY } = require('../helpers.js');

module.exports = {
  name        : 'apply-beta-tester',
  aliases     : [],
  description : 'Apply for the Beta Tester role',
  args        : [],
  guildOnly   : true,
  cooldown    : 10,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    const member = interaction.member;
    const user = member.user;
    const joinServer = new Date(member.joinedTimestamp);
    const today = new Date();

    // Auto decline if member is new to the server (< 14 days)
    if (today - joinServer < 14 * DAY) {
      interaction.reply({ content: 'Please apply again later once you have been in the server for at least 2 weeks.', ephemeral: true });
      // Upadte the history channel
      const historyChannel = interaction.guild.channels.cache.find(c => c.name === 'approval-history');
      historyChannel?.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription(`🚫 Application auto declined..\nMember: ${user}\nReason: \n${'```\nMember is too new to the server\n```'}\n\nDeclined by: ${member.guild.members.me.toString()}`).setTimestamp()] });
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

    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('apply-beta-tester')
      .setTitle('Apply for Beta Tester role');

    const reasonInput = new TextInputBuilder()
      .setCustomId('apply-beta-tester-reason')
      .setLabel('Why would you like to be a beta tester?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(400)
      .setRequired(true);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const actionRow = new ActionRowBuilder().addComponents(reasonInput);

    // Add inputs to the modal
    modal.addComponents(actionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
    return;
  },
};
