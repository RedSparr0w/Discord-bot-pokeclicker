const { MessageEmbed } = require('discord.js');
const { getUserReminders } = require('../database.js');

module.exports = {
  name        : 'reminders',
  aliases     : [],
  description : 'Current reminders',
  args        : [],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const reminders = await getUserReminders(msg.author);

    const embed = new MessageEmbed()
      .setTitle('Your Reminders:')
      .setFooter('Note that times are displayed in UTC')
      .setColor('#3498db');

    // Add reminders fields
    reminders.forEach(r => embed.addField(`**${new Date(+r.datetime).toISOString().replace(/T/, ' ').replace(/\..+/, '')}:**`, r.message.length >= 1024 ? `${r.message.substr(0, 1024)}...` : r.message));

    return msg.channel.send({ embed });
  },
};
