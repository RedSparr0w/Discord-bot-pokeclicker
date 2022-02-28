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
  name        : 'reminder',
  aliases     : ['remind', 'remindme', 'rm'],
  description : 'Command for modifying reminders',
  args        : [
    {
      name: 'view',
      type: 'SUB_COMMAND',
      description: 'View pending reminders',
    },
    {
      name: 'add',
      type: 'SUB_COMMAND',
      description: 'Add a new reminder',
      options: [
        {
          name: 'time',
          type: 'STRING',
          description: 'How long until you want to be reminded',
          required: true,
        },
        {
          name: 'message',
          type: 'STRING',
          description: 'What you want to be reminded about',
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      type: 'SUB_COMMAND',
      description: 'Remove reminder(s)',
      options: [
        {
          name: 'ids',
          type: 'STRING',
          description: 'Reminder ID(s) to remove',
          required: true,
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  execute     : async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      reminderAdd(interaction, interaction.options);
    }
    if (subcommand === 'remove') {
      reminderRemove(interaction, interaction.options);
    }
    if (subcommand === 'view') {
      reminderView(interaction, interaction.options);
    }
  },
};

const reminderRemove = async (interaction) => {
  const reminderIDs = interaction.options.get('ids').value.split(/\s/).map(Number);
  const reminders = await getUserReminders(interaction.user);
  const remindersToClear = reminders.filter(r => reminderIDs.includes(+r.id));

  if (!remindersToClear.length) {
    return interaction.reply('No reminders with specified IDs to clear!', { ephemeral: true });
  }

  clearReminders(remindersToClear.map(r => r.id));

  const embed = new MessageEmbed()
    .setTitle('Cleared Reminders:')
    .setFooter({ text: 'Note that times are displayed in UTC' })
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
    .setFooter({ text: 'Reminder Time' })
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
