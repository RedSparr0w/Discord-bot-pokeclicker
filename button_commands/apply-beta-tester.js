const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  name        : 'apply-beta-tester',
  aliases     : [],
  description : 'apply for the Beta Tester role',
  args        : [],
  guildOnly   : true,
  cooldown    : 10,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('apply-beta-tester')
      .setTitle('Apply for Beta Tester role');

    const reasonInput = new TextInputBuilder()
      .setCustomId('apply-beta-tester-reason')
      .setLabel('Why do you want to be a beta tester?')
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
