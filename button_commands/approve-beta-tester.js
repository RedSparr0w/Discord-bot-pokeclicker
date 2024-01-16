const { EmbedBuilder } = require('discord.js');
const { MINUTE, error } = require('../helpers.js');

module.exports = {
  name        : 'approve-beta-tester',
  aliases     : [],
  description : 'Approve user for beta tester role',
  args        : [],
  guildOnly   : true,
  cooldown    : 0.1,
  botperms    : ['SendMessages', 'ManageMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    // Get the embeds attached to this interaction
    const embeds = interaction.message.embeds.map(e => EmbedBuilder.from(e));
    const user_id = embeds[0].toJSON().description.match(/<@!?(\d+)>/)[1];
    const user_reason = interaction.message.embeds[0].fields[7].value;
    // Check they are still a member of the server
    const member = await interaction.guild.members.fetch(user_id).catch(error);
    if (!member) {
      embeds.forEach(e => e.setColor('#e74c3c'));
      embeds[embeds.length - 1].setFooter({ text: '🚫 No longer member of server..' }).setTimestamp();
      interaction.message.edit({ embeds, components: [] });
      interaction.reply({ content: `User is no longer a server member <@!${user_id}>..`, ephemeral: true });
      // Delete the application after x time
      setTimeout(() => interaction.message.delete().catch(e => error('Unable to delete missing member application')), 1 * MINUTE);
      return;
    }
    // Check the role exists in this server
    const role = interaction.guild.roles.cache.find(r => r.name === 'Beta Tester');
    if (!role) {
      interaction.reply({ content: 'Unable to find Beta Tester role, try again later..', ephemeral: true });
      return;
    }
    // Apply the beta tester role
    member.roles.add(role);
    // Update our embed, remove the buttons
    embeds.forEach(e => e.setColor('#2ecc71'));
    embeds[embeds.length - 1].setFooter({ text: '☑️ Application approved!' }).setTimestamp();
    interaction.update({ embeds, components: [] });
    // Delete the application after x time
    setTimeout(() => interaction.message.delete().catch(e => error('Unable to delete approved application')), 1 * MINUTE);
    // Upadte the history channel
    const historyChannel = interaction.guild.channels.cache.find(c => c.name === 'approval-history');
    historyChannel?.send({ embeds: [new EmbedBuilder().setColor('#2ecc71').setDescription(`☑️ Application approved!\nMember: <@!${user_id}>\nReason: \n${user_reason}\n\nApproved by: ${interaction.user}`).setTimestamp()] });
    return;
  },
};
