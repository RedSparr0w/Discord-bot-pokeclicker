const { EmbedBuilder } = require('discord.js');
const { trainerCardBadges } = require('../helpers.js');

module.exports = {
  name        : 'badges',
  aliases     : [],
  description : 'Check what badges can be earned for your trainer card',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const embed = new EmbedBuilder()
      .setDescription(
        trainerCardBadges.map(b => `**${b.icon} ${b.name} Badge:**\n_${b.description}_`).join('\n')
      )
      .setColor('#3498db');
    return interaction.reply({ embeds: [embed] });
  },
};
