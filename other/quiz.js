const { MessageEmbed } = require('discord.js');
const { quizChannelID, ownerID } = require('../config.js');
const { addAmount, addStatistic, addPurchased } = require('../database.js');
const {
  SECOND,
  MINUTE,
  HOUR,
  warn,
  log,
} = require('../helpers.js');
const { getQuizQuestion } = require('./quiz_questions.js');

const money_icon = '<:money:737206931759824918>';

// Between 1 and 6 minutes
const getTimeLimit = () => Math.floor(Math.random() * (5 * MINUTE)) + (1 * MINUTE);
const isHappyHour = () => Date.now() % (9 * HOUR) < HOUR;

const postHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;
  quiz_channel.setRateLimitPerUser(0, 'Happy Hour!').catch(O_o=>{});
  setTimeout(() => quiz_channel.setRateLimitPerUser(5, 'Happy Hour!').catch(O_o=>{}), HOUR);

  const embed = new MessageEmbed()
    .setTitle('It\'s Happy Hour!')
    .setDescription(['For the next 1 hour, questions will be posted 6x as often!', '', 'Good Luck!'])
    .setColor('#2ecc71');

  return await quiz_channel.send('<@&788190728027242496>', { embed });
};

const newQuiz = async (guild, reoccur = false) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  // Generate and send a random question
  const quiz = getQuizQuestion();

  // Time limit in minutes (2 → 10 minutes)
  let time_limit = getTimeLimit();

  const happyHour = isHappyHour();

  // 3 x more questions
  if (happyHour) {
    time_limit /= 6;
    quiz.embed.setFooter('Happy Hour! (questions 6x more often)');
  }

  const bot_message = await quiz_channel.send({ embed: quiz.embed }).catch((...args) => warn('Unable to send quiz question', ...args));

  // If no bot message for whatever reason, try again in 1 minute
  if (!bot_message) return setTimeout(() => newQuiz(guild, reoccur), MINUTE);

  // Post another question once the timer finishes
  if (reoccur) setTimeout(() => newQuiz(guild, reoccur), time_limit);

  // Which messages are we trying to catch
  const filter = m => quiz.answer.test(m.content);

  // Reason for footer once finished
  let end_reason = 'Closed';
  let finished = 0;

  const winners = new Set();

  const collector = quiz_channel.createMessageCollector(filter, { time: time_limit });
  collector.on('collect', async m => {
    const user = m.author;

    // If this is the first answer
    if (!finished) {
      finished = m.createdTimestamp;
    } else {
      if (winners.has(user.id) || m.createdTimestamp - finished > 3 * SECOND) {
        return;
      }
      quiz.amount = Math.floor(quiz.amount / 2);
      if (!quiz.amount) {
        return;
      }
    }
    winners.add(user.id);
    const amount = quiz.amount;

    m.react('🎉');

    // Add coins to the users balance
    const [
      balance,
      answered,
    ] = await Promise.all([
      addAmount(user, amount),
      addStatistic(user, 'qz_answered'),
    ]);
    addStatistic(user, 'qz_coins_won', amount);

    // If user has answered more than 100 questions, give them the Marsh Badge
    if (answered >= 100) {
      await addPurchased(user, 'badge', 4);
    }

    const description = [
      `${user}`,
      '**CORRECT!**',
      `**+${amount} ${money_icon}**`,
    ];

    const embed = new MessageEmbed()
      .setDescription(description)
      .setFooter(`Answered: ${answered.toLocaleString('en-US')}\nBalance: ${balance.toLocaleString('en-US')}`)
      .setColor('#2ecc71');

    m.channel.send({ embed }).catch((...args) => warn('Unable to send quiz winner message', ...args));
  });
    
  // If code reaction, console log the expected answer
  const answerFilter = (reaction, user) => reaction.emoji.id === '761083768614027265' && user.id === ownerID;

  // Allow reactions for up to x ms
  const timer = 3e5; // (300 seconds)
  const logAnswer = bot_message.createReactionCollector(answerFilter, {time: timer});

  logAnswer.on('collect', async r => {
    bot_message.reactions.removeAll().catch(O_o=>{});
    log(quiz.answer);
  });

  // errors: ['time'] treats ending because of the time limit as an error
  quiz_channel.awaitMessages(filter, { max: 1, time:  time_limit, errors: ['time'] })
    .then(async collected => {
      // Set a reason for the message footer
      end_reason = 'Answered!';
    })
    .catch(collected => {
      // Set a reason for the message footer
      end_reason = 'Timed out!';
    }).finally(() => {
      // Update the message
      const botEmbed = bot_message.embeds[0];
      const description = `${botEmbed.description.split('\n').map(l => `~~${l.trim()}~~`).join('\n')}`;

      botEmbed.setDescription(description)
        .setFooter(`${botEmbed.footer ? botEmbed.footer.text : ''}\n${end_reason}`)
        .setColor('#e74c3c');

      bot_message.edit({ embed: botEmbed }).catch((...args) => warn('Unable to edit quiz question', ...args));
    });
};

module.exports = {
  newQuiz,
  postHappyHour,
};
