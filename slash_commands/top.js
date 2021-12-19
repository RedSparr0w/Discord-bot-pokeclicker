const { getTop } = require('../database.js');
const { postPages } = require('../helpers.js');

module.exports = {
  name        : 'top',
  aliases     : ['leaderboard', 'lb'],
  description : 'Get a list of users with the most points in specific categories',
  args        : [
    {
      name: 'type',
      type: 'STRING',
      description: 'How many lines you want to play (default 3)',
      required: false,
      choices: [
        {
          name: 'Answers',
          value: 'answers',
        },
        {
          name: 'Quiz',
          value: 'answers',
        },
        {
          name: 'Messages',
          value: 'messages',
        },
        {
          name: 'Commands',
          value: 'commands',
        },
        {
          name: 'Timely',
          value: 'timely',
        },
        {
          name: 'Daily',
          value: 'daily',
        },
        {
          name: 'Coins',
          value: 'coins',
        },
        {
          name: 'Coins-won',
          value: 'coins-won',
        },
        {
          name: 'Coins-lost',
          value: 'coins-lost',
        },
        {
          name: 'Coins-bet',
          value: 'coins-bet',
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands', 'bragging'],
  execute     : async (interaction) => {
    const type = interaction.options.get('type')?.value || 'coins';

    let pages, results, resultsText;
    switch(type) {
      /* Stat type top commands */
      case 'answer':
      case 'answers':
      case 'answered':
      case 'quiz':
        results = await getTop(100, 'qz_answered');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} answered\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} quiz masters:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'messages':
      case 'message':
      case 'msg':
        results = await getTop(100, 'messages');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} messages\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} messages sent:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'commands':
      case 'command':
      case 'cmd':
        results = await getTop(100, 'commands');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} commands\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} commands used:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'coins-won':
        results = await getTop(100, 'coins-won');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} coins won:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'coins-lost':
        results = await getTop(100, 'coins-lost');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} coins lost:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'coins-bet':
        results = await getTop(100, 'coins-bet');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} coins bet:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      /* End stat type top commands */
      case 'timely':
        results = await getTop(100, 'timely');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} timely streak:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'daily':
      case 'claim':
        results = await getTop(100, 'claim');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} daily streak:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'coins':
      default:
        results = await getTop(100, 'coins');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} trainers:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
    }

    postPages(interaction, pages, 1, true);
  },
};
