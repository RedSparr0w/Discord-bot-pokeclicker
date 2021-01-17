const { getTop } = require('../database.js');
const { postPages } = require('../helpers.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard', 'lb'],
  description : 'Get a list of users with the most points',
  args        : ['type?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner', 'bot-commands', 'bragging'],
  execute     : async (msg, args) => {
    const [type = 'coins'] = args;

    let pages, results, resultsText;
    switch(type) {
      case 'answer':
      case 'answers':
      case 'answered':
      case 'quiz':
        results = await getTop(100, 'quiz');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} answered\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Quiz Masters:***__`, ...resultsText.splice(0, 10)]);
        break;
      case 'timely':
        results = await getTop(100, 'timely');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Timely Streak:***__`, ...resultsText.splice(0, 10)]);
        break;
      case 'daily':
      case 'claim':
        results = await getTop(100, 'claim');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Daily Streak:***__`, ...resultsText.splice(0, 10)]);
        break;
      case 'coins':
      default:
        results = await getTop(100);
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Trainers:***__`, ...resultsText.splice(0, 10)]);
    }

    postPages(msg, pages, 1, true);
  },
};
