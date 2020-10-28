const { getTop } = require('../database.js');
const { postPages } = require('../helpers.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard', 'lb'],
  description : 'Get a list of users with the most points',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands', 'game-corner', 'bragging'],
  execute     : async (msg, args) => {
    const results = await getTop(100);
    const resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);

    const pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Trainers:***__`, ...resultsText.splice(0, 10)]);

    postPages(msg, pages, 1, true);
  },
};
