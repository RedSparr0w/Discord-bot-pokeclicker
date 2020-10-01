const { MessageEmbed } = require('discord.js');

const mutedRoleID = '758167963294629898';

module.exports = {
  name        : 'mute',
  aliases     : [],
  description : `Apply the <@&${mutedRoleID}> role to users`,
  args        : ['@users'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MUTE_MEMBERS'], // Voice mut permission
  execute     : async (msg, args) => {
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!msg.mentions.members.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embed });
    }

    const output = [msg.author, '', 'Muted the following users:'];

    for (const [, member] of [...msg.mentions.members]) {
      await member.roles.add(mutedRoleID, `User muted by ${msg.member.displayName}-${msg.author.id}`);
      output.push(`${member}`);
    }

    embed.setColor('#3498db').setDescription(output);

    msg.channel.send({ embed });
  },
};
