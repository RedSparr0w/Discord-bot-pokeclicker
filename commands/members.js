module.exports = {
  name        : 'members',
  aliases     : [],
  description : 'Retrieve a list of current server members',
  usage       : '',
  args        : [],
  guildOnly   : true,
  cooldown    : 60,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_ROLES'],
  execute     : async (msg, args) => {
    if ( msg.guild.members.size > 100 ) return msg.reply('Sorry, There is too many members to use this function.');
    const members = [];
    msg.guild.members.cache.forEach(member => members.push(`${member.id}: ${member.displayName}${member.user.bot ? ' [BOT]' : ''}`));
    msg.channel.send(members, { code:'http', split: true });
  },
};
