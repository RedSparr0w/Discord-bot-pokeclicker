const { EmbedBuilder } = require('discord.js');
const { externalScriptsRoleID } = require('../config.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'scripting',
  aliases     : ['scripter', 'scripts'],
  description : `Apply the <@&${externalScriptsRoleID}> role to users`,
  args        : ['@users'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks', 'ManageRoles'],
  userperms   : ['MUTE_MEMBERS'], // Voice mute permission
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    const embed = new EmbedBuilder().setColor('#e74c3c');

    if (!msg.mentions.members.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [msg.author, '', `Applied <@&${externalScriptsRoleID}> role to the following users:`];

    for (const [, member] of [...msg.mentions.members]) {
      if (member == msg.guild.members.me) {
        const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Good try, But I\'m not cheating trainer!');
        return msg.reply({ embeds: [embed] });
      }
      await member.roles.add(externalScriptsRoleID, `Role applied by ${msg.member.displayName}-${msg.author.id}`);
      output.push(member);
      modLog(msg.guild,
        `**Mod:** ${msg.author.toString()}
        **User:** ${member.toString()}
        **Action:** <@&${externalScriptsRoleID}> role applied`);
    }

    embed.setColor('#3498db').setDescription(output.join('\n'));

    msg.channel.send({ embeds: [embed] });
  },
};
