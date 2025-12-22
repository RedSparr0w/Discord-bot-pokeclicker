const { spamDetection } = require('../../config.js');
const { getStatistic } = require('../../database.js');
const { SECOND, HOUR, formatDateToString } = require('../../helpers.js');
const { mute, modLog } = require('./functions');
const { EmbedBuilder } = require('discord.js');


let messageLog = [];

const check = async (message) => {
  // If message is empty or a command, ignore it
  if (message.content.startsWith('/')) {
    return;
  }

  // Log the message
  log(message);

  // Check if user has been spamming
  if (message.content && isSpam(message, spamDetection?.spam?.amount, spamDetection?.spam?.time)) {
    let time = spamDetection?.spam?.mute || 2 * HOUR;
    time = await mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.members.me.toString()}
      **User:** ${message.member.toString()} (${message.member.id})
      **Action:** Muted
      **Reason:** _spamming_
      **Duration:** _${formatDateToString(time)}_
      **Channel:** ${message.channel.name}
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`Stop spamming!\n\nYou will be unmuted in ${formatDateToString(time)}`);
    return message.reply({ embeds: [embed] });
  }

  // Check if user has been spamming the same message
  if (message.content && isDupe(message, spamDetection?.dupe?.amount, spamDetection?.dupe?.time)) {
    let time = spamDetection?.dupe?.mute || 2 * HOUR;
    time = await mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.members.me.toString()}
      **User:** ${message.member.toString()} (${message.member.id})
      **Action:** Muted
      **Reason:** _spamming (duplicate messages)_
      **Duration:** _${formatDateToString(time)}_
      **Channel:** ${message.channel.name}
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`Stop spamming!\n_(duplicate message)_\n\nYou will be unmuted in ${formatDateToString(time)}`);
    return message.reply({ embeds: [embed] });
  }

  // Check if user has sent less than 10 messages and their message contains 3 images or more
  const messagesSentCount = await getStatistic(message.member.user, 'messages') || 0;

  // Count images in message content and attachments
  const imageCount = (message.content.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|webm)/gi) || []).length;
  const attachmentCount = message.attachments?.size || 0;
  const totalImageCount = imageCount + attachmentCount;
  
  // New: If a new user (<10 msgs) sends an empty message with an image of 828x616, mute and delete
  if (messagesSentCount < 10) {
    const isEmptyContent = !message.content || message.content.trim().length === 0;
    const imageAttachments = [...(message.attachments?.values?.() ?? [])]
      .filter(att => att && typeof att.width === 'number' && typeof att.height === 'number');

    const hasSuspiciousSize = imageAttachments.some(att => att.width === 828 && att.height === 616);

    if (isEmptyContent && hasSuspiciousSize) {
      let time = spamDetection?.imageSpam?.mute || 6 * HOUR;
      time = await mute(message.member, time);
      modLog(
        message.member.guild,
        `**Mod:** ${message.member.guild.members.me.toString()}
        **User:** ${message.member.toString()} (${message.member.id})
        **Action:** Deleted message, Muted
        **Reason:** _suspected telegram scam (image 828x616)_
        **Duration:** _${formatDateToString(time)}_
        **Channel:** ${message.channel.name}
        **Message Link:** _[Here](${message.url})_`
      );
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`Possible scam messages!
Message deleted.

You will be unmuted in ${formatDateToString(time)}`);
      await message.reply({ embeds: [embed] });
      return message.delete().catch(() => {});
    }
  }

  // If a new user (<10 msgs) sends 3 or more images, mute and delete (probable crypto scam)
  if (messagesSentCount < 10 && totalImageCount >= 3) {
    let time = spamDetection?.imageSpam?.mute || 6 * HOUR;
    time = await mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.members.me.toString()}
      **User:** ${message.member.toString()} (${message.member.id})
      **Action:** Muted
      **Reason:** _suspected crypto scam_
      **Duration:** _${formatDateToString(time)}_
      **Channel:** ${message.channel.name}
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`Possible scam messages!
Message deleted.

You will be unmuted in ${formatDateToString(time)}`);
    await message.reply({ embeds: [embed] });
    
    return message.delete().catch(() => {});
  }

  // Check for key spam/scam, words
  if (messagesSentCount < 10 && message.content.match(/(\$|dms?|bio|profile)/)) {
    let time = spamDetection?.keywordScamMessage?.mute || 3 * HOUR;
    // time = await mute(message.member, time);
    modLog(
      message.member.guild,
      `**Mod:** ${message.member.guild.members.me.toString()}
      **User:** ${message.member.toString()} (${message.member.id})
      **Action:** Nothing just logging
      **Reason:** _suspected scam (keywords)_
      **Duration:** _${formatDateToString(time)}_
      **Channel:** ${message.channel.name}
      **Message Link:** _[Here](${message.url})_
      **Message Content:**
      \
      \`\`\`\n${message.content.replace(/```/g, '``')}\n\`\`\``.substring(0, 4000)
    );
    /*
    const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`Possible scam message deleted..

You will be unmuted in ${formatDateToString(time)}`);
    await message.reply({ embeds: [embed] });
    
    return message.delete().catch(() => {});
    */
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
  // If an empty message ignore it
  if (!message.content) return false;

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
  // If an empty message ignore it
  if (!message.content) return false;

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
