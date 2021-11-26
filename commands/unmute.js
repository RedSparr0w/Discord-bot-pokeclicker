const { MessageEmbed } = require('discord.js');
const { mutedRoleID } = require('../config.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'unmute',
  aliases     : [],
  description : `Remove the <@&${mutedRoleID}> role from users`,
  args        : ['@users'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
  userperms   : ['MUTE_MEMBERS'], // Voice mute permission
  execute     : async (msg, args) => {
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!msg.mentions.members.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [msg.author, '', 'Unmuted the following users:'];

    for (const [, member] of [...msg.mentions.members]) {
      if (msg.member === member) {
        modLog(msg.guild,
          `**Mod:** ${msg.author.toString()}
          **User:** ${member.toString()}
          **Action:** Attempted to unmute themselves`);
        const embed = new MessageEmbed().setColor('#e74c3c').setDescription('You cannot un-mute yourself!');
        return msg.reply({ embeds: [embed] });
      }
      await member.roles.remove(mutedRoleID, `User unmuted by ${msg.member.displayName}-${msg.author.id}`);
      output.push(member);
      // Log to mod logs
      modLog(msg.guild,
        `**Mod:** ${msg.author.toString()}
        **User:** ${member.toString()}
        **Action:** Unmuted`);
    }

    embed.setColor('#3498db').setDescription(output.join('\n'));

    msg.channel.send({ embeds: [embed] });
  },
};
