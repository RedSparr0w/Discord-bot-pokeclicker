const { MessageEmbed } = require('discord.js');
const { trainerCardBadges } = require('../helpers.js');

module.exports = {
  name        : 'badges',
  aliases     : [],
  description : 'Check what badges can be earned for your trainer card',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const embed = new MessageEmbed()
      .setDescription(
        trainerCardBadges.map(b => `**${b.icon} ${b.name} Badge:**\n_${b.description}_`)
      )
      .setColor('#3498db');
    return msg.channel.send({ embed });
  },
};
