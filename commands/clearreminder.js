const { MessageEmbed } = require('discord.js');
const { getUserReminders, clearReminders } = require('../database.js');

module.exports = {
  name        : 'clearreminder',
  aliases     : ['clearreminders', 'removereminder', 'removereminders'],
  description : 'Clear some reminders',
  args        : ['reminder IDs'],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const reminderIDs = args.filter(a => +a).map(a => +a);
    const reminders = await getUserReminders(msg.author);
    const remindersToClear = reminders.filter(r => reminderIDs.includes(+r.id));

    if (!remindersToClear.length) {
      return msg.reply('No reminders with specified IDs to clear!');
    }

    clearReminders(remindersToClear.map(r => r.id));

    const embed = new MessageEmbed()
      .setTitle('Cleared Reminders:')
      .setFooter('Note that times are displayed in UTC')
      .setColor('#3498db');

    // Add reminders fields
    remindersToClear.forEach(r => embed.addField(`[${r.id}] **${new Date(+r.datetime).toISOString().replace(/T/, ' ').replace(/\..+/, '')}:**`, r.message.length >= 1000 ? `${r.message.substr(0, 1000)}...` : r.message));

    return msg.channel.send({ embed });
  },
};
