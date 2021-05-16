const { MessageEmbed } = require('discord.js');
const {
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  formatDateToString,
} = require('../helpers.js');
const { addReminder } = require('../database.js');

module.exports = {
  name        : 'remindme',
  aliases     : ['remind', 'reminder', 'rm'],
  description : 'Send a reminder message',
  args        : [],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const currentTime = Date.now();
    const mins = (msg.content.match(/\b(\d+)\s?m(in(ute)?(s)?)?\b/) || [0,0])[1];
    const hours = (msg.content.match(/\b(\d+)\s?h(our(s)?)?\b/) || [0,0])[1];
    const days = (msg.content.match(/\b(\d+)\s?d(ay(s)?)?\b/) || [0,0])[1];
    const weeks = (msg.content.match(/\b(\d+)\s?w(eek(s)?)?\b/) || [0,0])[1];

    const remindInTime = mins * MINUTE + hours * HOUR + days * DAY + weeks * WEEK;
    const reminderTime = new Date(+currentTime + remindInTime);

    const reminderMessage = msg.content.replace(/..?\w+(\b|\s)/, '').replace(/\b(\d+)\s?m(in(ute)?(s)?)?\b/, '').replace(/\b(\d+)\s?h(our(s)?)?\b/, '').replace(/\b(\d+)\s?d(ay(s)?)?\b/, '').replace(/\b(\d+)\s?w(eek(s)?)?\b/, '').trim();

    if (remindInTime <= 0) {
      return msg.reply('You need to add a time to remind you in (minutes, hours, days, weeks)');
    }

    await addReminder(msg.author, reminderTime, reminderMessage);

    const embed = new MessageEmbed()
      .setDescription(`I will send you a reminder in ${formatDateToString(remindInTime)}

      > ${reminderMessage}

      _Please make sure you are able to recieve Direct Messages from the bot,
      otherwise you will not get a reminder!_`)
      .setFooter('Reminder Time')
      .setTimestamp(reminderTime)
      .setColor('#3498db');
    return msg.channel.send({ embed });
  },
};
