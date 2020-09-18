const { getTop } = require('../database.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard', 'lb'],
  description : 'Get a list of users with the most points',
  args        : ['amount(10)?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const amount = +(args.find(arg=>/^\d+$/.test(arg)) || 10);

    // Check user has entered a valid amount
    if (isNaN(amount) || amount < 1 || amount > 40) return msg.channel.send('Invalid amount specified, Must be between 1 and 40...');

    const results = await getTop(amount);

    const output = [`__***Top ${results.length} Trainers:***__`];
      
    output.push(...results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`));

    // Send an initial message then edit it, so we don't ping the users every time this command is used
    msg.channel.send('Loading...').then(m => m.edit(output));
  },
};
