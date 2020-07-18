const { getTop } = require('../database.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard'],
  description : 'Get a list of users with the most points',
  args        : ['amount(10)?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_MESSAGES'],
  execute     : async (msg, args) => {
    const amount = +(args.find(arg=>/^\d+$/.test(arg)) || 10);

    // Check user has entered a valid amount
    if (isNaN(amount) || amount < 1 || amount > 40) return msg.channel.send('Invalid amount specified, Must be between 1 and 40...');

    const results = await getTop(msg.guild, amount);

    const output = [`__***Top ${results.length} users:***__`, ...results.map((res, place) => `**#${place + 1}** _\`(${res.points.toLocaleString('en-NZ')} points)\`_ ${msg.guild.members.cache.get(res.user) || 'Inactive Member'}`)];
    if (output.join('\n').length >= 2000)
      return msg.reply('Sorry this list is too large for discord, try a smaller amount');

    msg.channel.send('Gathering Data...').then(m=>m.edit(output));
  },
};
