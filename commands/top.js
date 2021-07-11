const { getTop } = require('../database.js');
const { postPages } = require('../helpers.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard', 'lb'],
  description : 'Get a list of users with the most points.\n\nType can be one of:\n`coins` (default) `quiz` `timely` `daily` `messages` `commands`',
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
      /* Stat type top commands */
      case 'answer':
      case 'answers':
      case 'answered':
      case 'quiz':
        results = await getTop(100, 'qz_answered');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} answered\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Quiz Masters:***__`, ...resultsText.splice(0, 10)]);
        break;
      case 'messages':
      case 'message':
      case 'msg':
        results = await getTop(100, 'messages');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} messages\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Messages Sent:***__`, ...resultsText.splice(0, 10)]);
        break;
      case 'commands':
      case 'command':
      case 'cmd':
        results = await getTop(100, 'commands');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} commands\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Commands Used:***__`, ...resultsText.splice(0, 10)]);
        break;
      /* End stat type top commands */
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
        results = await getTop(100, 'coins');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Trainers:***__`, ...resultsText.splice(0, 10)]);
    }

    postPages(interaction, pages, 1, true);
  },
};
