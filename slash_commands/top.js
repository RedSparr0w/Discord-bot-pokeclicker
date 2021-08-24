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
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : [],
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
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Quiz Masters:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'messages':
      case 'message':
      case 'msg':
        results = await getTop(100, 'messages');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} messages\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Messages Sent:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'commands':
      case 'command':
      case 'cmd':
        results = await getTop(100, 'commands');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} commands\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Commands Used:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      /* End stat type top commands */
      case 'timely':
        results = await getTop(100, 'timely');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Timely Streak:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'daily':
      case 'claim':
        results = await getTop(100, 'claim');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0} streak\` <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Daily Streak:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
        break;
      case 'coins':
      default:
        results = await getTop(100, 'coins');
        resultsText = results.map((res, place) => `**#${place + 1}** \`${res.amount ? res.amount.toLocaleString('en-NZ') : 0}\` <:money:737206931759824918> <@!${res.user}>`);
        pages = new Array(Math.ceil(results.length / 10)).fill('').map(page => [`__***Top ${results.length} Trainers:***__`, ...resultsText.splice(0, 10)]).map(i => ({ content: i.join('\n') }));
    }

    postPages(interaction, pages, 1, true);
  },
};
