const { MessageEmbed } = require('discord.js');
const { HOUR } = require('../helpers.js');
const { happyHourHours } = require('../other/quiz/happy_hour.js');

module.exports = {
  name        : 'happyhour',
  aliases     : ['hh'],
  description : 'Check when the next happy hour is',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands', 'game-corner', 'bot-coins'],
  execute     : async (msg, args) => {
    const now = Date.now();
    const happy_hour = new Date((now - (now % (happyHourHours * HOUR))) + happyHourHours * HOUR);
    
    const embed = new MessageEmbed()
      .setDescription('Next happy hour:')
      .setTimestamp(happy_hour)
      .setColor('#3498db');
    return msg.channel.send({ embed });
  },
};
