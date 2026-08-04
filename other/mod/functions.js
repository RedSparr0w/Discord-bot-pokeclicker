const { EmbedBuilder } = require('discord.js');
const { modLogChannelID, mutedRoleID } = require('../../config');
const { addScheduleItem, addStatistic } = require('../../database');
const { HOUR, error, formatDateToString } = require('../../helpers.js');

const modLog = (guild, logMessage, attachments = []) => {
  if (modLogChannelID) {
    const embed = new EmbedBuilder().setColor('#3498db').setDescription(logMessage);

    // Normalize attachments into an array of { url, name }
    const urls = attachments.map(a => (typeof a === 'string' ? { url: a, name: null } : { url: a.url || a.proxyURL || a.attachment, name: a.name || a.filename }));

    let files;
    if (urls.length) {
      const attachmentsList = urls.map((a, i) => `- [Attachment ${i + 1}](${a.url})`).join('\n').substring(0, 900);
      embed.addFields([{ name: 'Attachments', value: attachmentsList }]);

      // Provide files to upload (discord.js accepts URL attachments)
      files = urls.map((a, i) => ({ attachment: a.url, name: a.name || `attachment-${i + 1}` }));
    }

    const channel = guild.channels.cache.find(c => c.id == modLogChannelID || c.name == modLogChannelID);
    channel?.send({ embeds: [embed], files }).catch(() => {});
  }
};

const mute = async (member, time = 0) => {
  let mutes = 1;
  try {
    member.roles.add(mutedRoleID, `User muted by ${member.guild.members.me.displayName}-${member.guild.members.me.id}`);
    mutes = await addStatistic(member.user, 'mutes', 1) || 1;
    if (time) {
      time *= mutes;
      unmute(member, time);
    }
  } catch (e) {
    error('Unable to mute member\n', e);
  }
  return time;
};

const unmute = (member, time = 1 * HOUR) => {
  const date = Date.now();
  addScheduleItem('un-mute', member.user, +date + time, `${member.guild.id}|${formatDateToString(time)}`);
};

module.exports = {
  modLog,
  mute,
  unmute,
};
