const { MessageEmbed } = require('discord.js');
const {
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  formatDateToString,
} = require('../helpers.js');
const { addReminder, getUserReminders, clearReminders } = require('../database.js');

module.exports = {
  type        : 'interaction',
  name        : 'reminder',
  aliases     : ['remind', 'remindme', 'rm'],
  description : `Get the bot to send you a DM reminding you of something,
  Possible time arguments are minutes, hours, days or weeks.`,
  args        : ['time (1 day 1 hour)?', 'message?'],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (interaction) => {
    const [
      add,
      remove,
      view,
    ] =  [
      interaction.options.get('add'),
      interaction.options.get('remove'),
      interaction.options.get('view'),
    ];

    if (add) {
      reminderAdd(interaction, add.options);
    }
    if (remove) {
      reminderRemove(interaction, remove.options);
    }
    if (view) {
      reminderView(interaction, view.options);
    }
  },
};

const reminderRemove = async (interaction) => {
  const reminderIDs = interaction.options.get('id').value.split(/\s/).map(Number);
  const reminders = await getUserReminders(interaction.user);
  const remindersToClear = reminders.filter(r => reminderIDs.includes(+r.id));

  if (!remindersToClear.length) {
    return interaction.reply('No reminders with specified IDs to clear!', { ephemeral: true });
  }

  clearReminders(remindersToClear.map(r => r.id));

  const embed = new MessageEmbed()
    .setTitle('Cleared Reminders:')
    .setFooter('Note that times are displayed in UTC')
    .setColor('#3498db');

  // Add reminders fields
  remindersToClear.forEach(r => embed.addField(`[${r.id}] **${new Date(+r.datetime).toISOString().replace(/T/, ' ').replace(/\..+/, '')}:**`, r.message.length >= 1000 ? `${r.message.substr(0, 1000)}...` : r.message));

  return interaction.reply({ embeds: [embed] });
};

const reminderAdd = async (interaction, options) => {
  
  const currentTime = Date.now();
  const mins = ((options.get('time')?.value || '').match(/\b(\d+)\s?m(in(ute)?(s)?)?\b/i) || [0,0])[1];
  const hours = ((options.get('time')?.value || '').match(/\b(\d+)\s?h(our(s)?)?\b/i) || [0,0])[1];
  const days = ((options.get('time')?.value || '').match(/\b(\d+)\s?d(ay(s)?)?\b/i) || [0,0])[1];
  const weeks = ((options.get('time')?.value || '').match(/\b(\d+)\s?w(eek(s)?)?\b/i) || [0,0])[1];

  const remindInTime = mins * MINUTE + hours * HOUR + days * DAY + weeks * WEEK;
  const reminderTime = new Date(+currentTime + remindInTime);

  const reminderMessage = (options.get('message')?.value || '');

  if (reminderMessage.length < 1) {
    return interaction.reply('Reminder message cannot be empty!', { ephemeral: true });
  }

  await addReminder(interaction.user, reminderTime, reminderMessage);

  const embed = new MessageEmbed()
    .setDescription(`I will send you a reminder in ${formatDateToString(remindInTime)}

    > ${reminderMessage.replace(/\n/g, '\n> ')}

    _Please make sure you are able to receive Direct Messages from the bot,
    otherwise you will not get a reminder!_`)
    .setFooter('Reminder Time')
    .setTimestamp(reminderTime)
    .setColor('#3498db');
  return interaction.reply({ embeds: [embed] });
};

const reminderView = async (interaction) => {
  const reminders = await getUserReminders(interaction.user);

  const embed = new MessageEmbed()
    .setTitle('Pending Reminders:')
    .setColor('#3498db');

  // Add reminders fields
  reminders.forEach(r => embed.addField(`[${r.id}] **<t:${Math.ceil(+r.datetime / 1000)}:R>:**`, r.message.length >= 1000 ? `${r.message.substr(0, 1000)}...` : r.message));

  return interaction.reply({ embeds: [embed] });
};
