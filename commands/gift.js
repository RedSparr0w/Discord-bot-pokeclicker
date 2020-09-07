const { MessageEmbed } = require('discord.js');
const { addAmount } = require('../database.js');

module.exports = {
  name        : 'gift',
  aliases     : [],
  description : 'Gift points to specified user',
  args        : ['points', '@user'],
  guildOnly   : true,
  cooldown    : 1,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_GUILD'],
  execute     : async (msg, args) => {
    const amount = +(args.find(arg=>/^-?\d+$/.test(arg)) || 10);
    
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (isNaN(amount)) {
      embed.setDescription('Invalid amount specified..');
      return msg.channel.send({ embed });
    }
    if (!msg.mentions.users.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embed });
    }

    const output = [msg.author, `Gifted ${amount.toLocaleString('en-NZ')} <:money:737206931759824918> to the following users`, ''];

    for (const [, user] of [...msg.mentions.users]) {
      const balance = await addAmount(user, amount);
      output.push(`${user}: ${balance.toLocaleString('en-NZ')} <:money:737206931759824918>`);
    }

    embed.setColor('#2ecc71')
      .setDescription(output);

    msg.channel.send({ embed });
  },
};
