const { MessageEmbed } = require('discord.js');
const { mutedRoleID } = require('../config.js');

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
      await member.roles.remove(mutedRoleID, `User unmuted by ${msg.member.displayName}-${msg.author.id}`);
      output.push(member);
    }

    embed.setColor('#3498db').setDescription(output.join('\n'));

    msg.channel.send({ embeds: [embed] });
  },
};
