const { addPoints } = require('../database.js');

module.exports = {
  name        : 'give',
  aliases     : [],
  description : 'Give points to specified user',
  args        : ['points', '@user'],
  guildOnly   : true,
  cooldown    : 1,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_GUILD'],
  execute     : async (msg, args) => {
    const points = +(args.find(arg=>/^\d+$/.test(arg)) || 10);
    if (isNaN(points))
      return msg.reply('Invalid number of points specified..');
    if (!msg.mentions.users.size)
      return msg.reply('You didn\'t mention who to give points..');
    // Add 1 point to the verifier
    const user = msg.mentions.users.first();
    const total_points = await addPoints(msg.guild, user, points);
    msg.channel.send(`${user} given ${points.toLocaleString('en-NZ')} points, New total is ${total_points.toLocaleString('en-NZ')} points`);
  },
};
