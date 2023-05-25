const { EmbedBuilder } = require('discord.js');

module.exports = {
  name        : 'roleinfo',
  aliases     : [],
  description : 'Get servers role info',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : ['ManageGuild'],
  channels    : [],
  execute     : async (msg, args) => {
    const guild = msg.guild;

    const roles = guild.roles.cache;
    const roleMemberCount = roles.sort((a, b) => b.rawPosition - a.rawPosition).map(r => {
      const members = roles.get(r.id).members;
      return `${r}: ${members.size}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('Random')
      .addFields({
        name: 'Role Members:',
        value: roleMemberCount,
      })
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  },
};
