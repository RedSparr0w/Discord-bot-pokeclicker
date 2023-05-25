const { EmbedBuilder } = require('discord.js');
const { modLogChannelID, mutedRoleID } = require('../../config');
const { addScheduleItem, addStatistic } = require('../../database');
const { HOUR, error, formatDateToString } = require('../../helpers.js');

const modLog = (guild, logMessage) => {
  if (modLogChannelID) {
    const embed = new EmbedBuilder().setColor('#3498db').setDescription(logMessage);
    guild.channels.cache.find(c => c.id == modLogChannelID || c.name == modLogChannelID)?.send({ embeds: [embed] });
  }
};

const mute = async (member, time = 0) => {
  let mutes = 1;
  try {
    member.roles.add(mutedRoleID, `User muted by ${member.guild.me.displayName}-${member.guild.me.id}`);
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
