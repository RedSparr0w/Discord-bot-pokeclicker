const { spamDetection } = require('../../config.js');
const { SECOND, HOUR, formatDateToString } = require('../../helpers.js');
const { mute, modLog } = require('./functions');
const { MessageEmbed } = require('discord.js');


let messageLog = [];

const check = (message) => {
  if (message.content.startsWith('/')) {
    return;
  }

  // Log the message
  log(message);

  // Check if user has been spomming
  if (isSpam(message, spamDetection?.spam?.amount, spamDetection?.spam?.time)) {
    const time = spamDetection?.spam?.mute || 2 * HOUR;
    mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.me.toString()}
      **User:** ${message.member.toString()}
      **Action:** Muted
      **Reason:** _spamming_
      **Duration:** _${formatDateToString(time)}_
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`Stop spamming!\n\nYou will be unmuted in ${formatDateToString(time)}`);
    return message.reply({ embeds: [embed] });
  }

  // Check if user has been spomming the same message
  if (isDupe(message, spamDetection?.dupe?.amount, spamDetection?.dupe?.time)) {
    const time = spamDetection?.dupe?.mute || 2 * HOUR;
    mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.me.toString()}
      **User:** ${message.member.toString()}
      **Action:** Muted
      **Reason:** _spamming (duplicate messages)_
      **Duration:** _${formatDateToString(time)}_
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`Stop spamming!\n_(duplicate message)_\n\nYou will be unmuted in ${formatDateToString(time)}`);
    return message.reply({ embeds: [embed] });
  }
};

const log = (message, maxLog = 500) => {
  // Check ignored channels
  if (spamDetection?.ignoreChannels?.find(c => c == message.channel.name || c == message.channel.id)) {
    return;
  }

  // Add the message to the log
  messageLog.unshift({
    authorID: message.author.id,
    content: message.content,
    createdTimestamp: message.createdTimestamp,
  });

  // Clean up the log, don't want it getting too large
  messageLog.splice(maxLog);
};

const isSpam = (message, amount = 4, interval = 3 * SECOND) => {
  // If disabled always return false
  if (!spamDetection?.spam?.amount) return false;

  // Only get messages from the same author, within the interval given
  const filter = log => log.authorID == message.author.id && message.createdTimestamp - log.createdTimestamp < interval;
  const occurances = messageLog.filter(filter).length;

  // If more messages than our threshold return true, remove messages from log so we don't trigger twice
  if (occurances >= amount) {
    messageLog = messageLog.filter(m => !filter(m));
    return true;
  }

  // return false, no spam
  return false;
};

const isDupe = (message, amount = 3, interval = 30 * SECOND) => {
  // If disabled always return false
  if (!spamDetection?.dupe?.amount) return false;

  // Only get messages from the same author, within the interval given, with the same content
  const filter = log => log.authorID == message.author.id && message.createdTimestamp - log.createdTimestamp < interval && log.content == message.content;
  const occurances = messageLog.filter(filter).length;

  // If more messages than our threshold return true, remove messages from log so we don't trigger twice
  if (occurances >= amount) {
    messageLog = messageLog.filter(m => !filter(m));
    return true;
  }

  // return false, no dupes
  return false;
};

module.exports = {
  check,
  log,
  isSpam,
  isDupe,
};
