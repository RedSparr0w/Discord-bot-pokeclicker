const { EmbedBuilder } = require('discord.js');
const { MINUTE, error } = require('../helpers.js');

module.exports = {
  name        : 'decline-beta-tester',
  aliases     : [],
  description : 'Decline user for beta tester role',
  args        : [],
  guildOnly   : true,
  cooldown    : 0,
  botperms    : ['SendMessages', 'ManageMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    // Get the embeds attached to this interaction
    const embeds = interaction.message.embeds.map(e => EmbedBuilder.from(e));
    // Update our embed, remove the buttons
    embeds.forEach(e => e.setColor('#e74c3c'));
    embeds[embeds.length - 1].setFooter({ text: '🚫 Application declined..' }).setTimestamp()
    interaction.update({ embeds, components: [] });
    // Delete the application after x time
    setTimeout(() => interaction.message.delete().catch(e => error('Unable to delete declined application')), 1 * MINUTE);
    // Upadte the history channel
    const user_id = embeds[0].toJSON().description.match(/<@!?(\d+)>/)[1];
    const historyChannel = interaction.guild.channels.cache.find(c => c.name === 'approval-history');
    historyChannel?.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription(`🚫 Application declined..\nMember: <@!${user_id}>\nDeclined by: ${interaction.user}`).setTimestamp()] });
    return;
  },
};
