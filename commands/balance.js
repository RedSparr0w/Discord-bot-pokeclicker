const { MessageEmbed } = require('discord.js');
const { getAmount } = require('../database.js');

module.exports = {
  name        : 'balance',
  aliases     : ['bal', '$'],
  description : 'Get your current balance',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const balance = await getAmount(msg.author);

    const output = [
      msg.author,
      `**Balance: ${balance.toLocaleString('en-US')} <:money:737206931759824918>**`,
    ].join('\n');

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(output);

    return msg.channel.send({ embed });
  },
};
