const { MessageEmbed } = require('discord.js');
const { modLogChannelID, mutedRoleID } = require('../../config');
const { addScheduleItem } = require('../../database');
const { HOUR, error, formatDateToString } = require('../../helpers.js');

const modLog = (guild, logMessage) => {
  if (modLogChannelID) {
    const embed = new MessageEmbed().setColor('#3498db').setDescription(logMessage);
    guild.channels.cache.find(c => c.id == modLogChannelID || c.name == modLogChannelID)?.send({ embeds: [embed] });
  }
};

const mute = (member, time = 0) => {
  try {
    member.roles.add(mutedRoleID, `User muted by ${member.guild.me.displayName}-${member.guild.me.id}`);
    if (time) {
      unmute(member, time);
    }
  } catch (e) {
    error('Unable to mute member\n', e);
  }
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
