const { MessageEmbed } = require('discord.js');
const { getAmount } = require('../database.js');
const { serverIcons } = require('../config.js');

module.exports = {
  name        : 'balance',
  aliases     : ['bal', '$'],
  description : 'Get your current balance',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner', 'bot-commands', 'bragging'],
  execute     : async (msg, args) => {
    const balance = await getAmount(msg.author);

    const output = [
      msg.author,
      `**Balance: ${balance.toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(output);

    return msg.channel.send({ embed });
  },
};
