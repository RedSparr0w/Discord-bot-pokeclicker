const { MessageEmbed } = require('discord.js');
const { addAmount } = require('../database.js');
const { serverIcons } = require('../config.js');

module.exports = {
  name        : 'gift',
  aliases     : [],
  description : 'Gift points to specified user',
  args        : ['points', '@user'],
  guildOnly   : true,
  cooldown    : 1,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    const amount = +(args.find(arg=>/^-?\d+$/.test(arg)) || 10);
    
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (isNaN(amount)) {
      embed.setDescription('Invalid amount specified..');
      return msg.channel.send({ embeds: [embed] });
    }
    if (!msg.mentions.users.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [msg.author, `Gifted ${amount.toLocaleString('en-NZ')} ${serverIcons.money} to the following users`, ''];

    for (const [, user] of [...msg.mentions.users]) {
      const balance = await addAmount(user, amount);
      output.push(`${user}: ${balance.toLocaleString('en-NZ')} ${serverIcons.money}`);
    }

    embed.setColor('#2ecc71')
      .setDescription(output.join('\n'));

    msg.channel.send({ embeds: [embed] });
  },
};
