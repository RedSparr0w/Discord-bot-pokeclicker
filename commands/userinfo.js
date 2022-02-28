const { MessageEmbed } = require('discord.js');

module.exports = {
  name        : 'userinfo',
  aliases     : [],
  description : 'Get a members server info',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MUTE_MEMBERS'],
  channels    : [],
  execute     : async (msg, args) => {
    const user = msg.mentions.users.first() || msg.author;
    const member = msg.mentions.members.first() || msg.member;

    const joinDiscord = new Date(user.createdTimestamp);
    const joinServer = new Date(member.joinedTimestamp);
    const embed = new MessageEmbed()
      .setAuthor(user.tag, user.displayAvatarURL())
      .setDescription(user.toString())
      .setColor('RANDOM')
      .setThumbnail(user.displayAvatarURL())
      .addField('Status:', member.presence.status)
      .addField('Joined Discord:', `<t:${Math.floor(+joinDiscord / 1000)}:R>`)
      .addField('Joined Server:', `<t:${Math.floor(+joinServer / 1000)}:R>`)
      .addField('Roles:', member.roles.cache.map(r => `${r}`).join('\n'))
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();

    return msg.channel.send({ embeds: [embed] });
  },
};
