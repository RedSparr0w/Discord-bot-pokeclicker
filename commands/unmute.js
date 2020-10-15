const { MessageEmbed } = require('discord.js');

const mutedRoleID = '758167963294629898';

module.exports = {
  name        : 'unmute',
  aliases     : [],
  description : `Remove the <@&${mutedRoleID}> role from users`,
  args        : ['@users'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
  userperms   : ['MUTE_MEMBERS'], // Voice mut permission
  execute     : async (msg, args) => {
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!msg.mentions.members.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embed });
    }

    const output = [msg.author, '', 'Unmuted the following users:'];

    for (const [, member] of [...msg.mentions.members]) {
      await member.roles.remove(mutedRoleID, `User unmuted by ${msg.member.displayName}-${msg.author.id}`);
      output.push(member);
    }

    embed.setColor('#3498db').setDescription(output);

    msg.channel.send({ embed });
  },
};
