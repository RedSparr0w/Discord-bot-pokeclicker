const { MessageEmbed } = require('discord.js');

const externalScriptsRoleID = '761015248856809493';

module.exports = {
  name        : 'scripting',
  aliases     : ['scripter', 'scripts'],
  description : `Apply the <@&${externalScriptsRoleID}> role to users`,
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

    const output = [msg.author, '', `Applied <@&${externalScriptsRoleID}> role to the following users:`];

    for (const [, member] of [...msg.mentions.members]) {
      await member.roles.add(externalScriptsRoleID, `Role applied by ${msg.member.displayName}-${msg.author.id}`);
      output.push(member);
    }

    embed.setColor('#3498db').setDescription(output);

    msg.channel.send({ embed });
  },
};
