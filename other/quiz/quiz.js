const { MessageEmbed } = require('discord.js');
const { quizChannelID, ownerID, serverIcons } = require('../../config.js');
const { addAmount, addStatistic, addPurchased } = require('../../database.js');
const {
  SECOND,
  MINUTE,
  warn,
  log,
  trainerCardBadgeTypes,
} = require('../../helpers.js');
const { getQuizQuestion } = require('./quiz_questions.js');
const { happyHourBonus, isHappyHour } = require('./happy_hour.js');
const { trainerCardBadges } = require('../../helpers/trainer_card.js');

// Between 1 and 6 minutes
const getTimeLimit = () => Math.floor(Math.random() * (5 * MINUTE)) + (1 * MINUTE);
const ANSWER_TIME_LIMIT = 5 * SECOND;

const newQuiz = async (guild, reoccur = false) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  // Generate and send a random question
  const quiz = await getQuizQuestion();

  // Time limit in minutes (2 → 10 minutes)
  let time_limit = getTimeLimit();

  const happyHour = isHappyHour();

  // 3 x more questions
  if (happyHour) {
    time_limit /= happyHourBonus;
    quiz.embed.setFooter(`Happy Hour!\n(${happyHourBonus} × Faster Questions, ${happyHourBonus} × Shiny Chance)`);
  }

  const bot_message = await quiz_channel.send({ embeds: [quiz.embed], files: quiz.files }).catch((...args) => warn('Unable to send quiz question', ...args));

  // If no bot message for whatever reason, try again in 1 minute
  if (!bot_message) return setTimeout(() => newQuiz(guild, reoccur), MINUTE);

  // Post another question once the timer finishes
  if (reoccur) setTimeout(() => newQuiz(guild, reoccur), time_limit + ANSWER_TIME_LIMIT);

  // Which messages are we trying to catch
  const filter = m => quiz.answer.test(m.content);

  let finished = 0;

  const winners = new Set();
  const winner_data = [];

  const collector = quiz_channel.createMessageCollector({ filter, time: time_limit });
  collector.on('collect', async m => {
    const user = m.author;

    // If this is the first answer
    if (!finished) {
      finished = m.createdTimestamp;
    } else {
      quiz.amount = Math.ceil(quiz.amount / 2);
      if (!quiz.amount || winners.has(user.id) || m.createdTimestamp - finished > ANSWER_TIME_LIMIT) {
        return;
      }
    }
    winners.add(user.id);
    const amount = quiz.amount;

    m.react(serverIcons.money.match(/:(\d+)>/)[1]);
    if (quiz.shiny) {
      m.react('✨');
    }

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
    if (answered == 100) {
      await addPurchased(user, 'badge', trainerCardBadgeTypes.Marsh);
      const congratsEmbed = new MessageEmbed().setTitle('Congratulations!').setColor('RANDOM').setDescription([
        m.author.toString(),
        `You just earned the ${trainerCardBadges[trainerCardBadgeTypes.Marsh].icon} Marsh badge for having ${answered} questions answered!`,
      ].join('\n'));
      m.channel.send({ embeds: [congratsEmbed] });
    }

    if (answered % 1000 == 0) {
      const congratsEmbed = new MessageEmbed().setTitle('Congratulations!').setColor('RANDOM').setDescription([
        m.author.toString(),
        `You just reached ${answered.toLocaleString('en-US')} questions answered!`,
      ].join('\n'));
      m.channel.send({ embeds: [congratsEmbed] });
    }

    winner_data.push({user, amount, balance, answered});
  });
    
  // If code reaction, console log the expected answer
  const answerFilter = (reaction, user) => reaction.emoji.id === '761083768614027265' && user.id === ownerID;

  // Allow reactions for up to x ms
  const timer = 12e5; // (1200 seconds)
  const logAnswer = bot_message.createReactionCollector({ filter: answerFilter, time: timer });

  logAnswer.on('collect', async r => {
    bot_message.reactions.removeAll().catch(O_o=>{});
    log(quiz.answer);
  });

  // errors: ['time'] treats ending because of the time limit as an error
  quiz_channel.awaitMessages({ filter, max: 1, time:  time_limit, errors: ['time'] })
    .then(() => {
      // Update the message
      const botEmbed = bot_message.embeds[0];
      setTimeout(() => {
        // Send out the correct users and amounts
        if (winner_data.length) {
          const description = winner_data.sort((a,b) => b.amount - a.amount).map(w => `[${w.user}](https://cancel "Answered: ${w.answered.toLocaleString('en-US')}\nBalance: ${w.balance.toLocaleString('en-US')}"): **+${w.amount} ${serverIcons.money}**`);
          const embed = new MessageEmbed()
            .setTitle('**Correct:**')
            .setDescription(description.join('\n'))
            .setColor('#2ecc71');
      
          bot_message.channel.send({ embeds: [embed] }).catch((...args) => warn('Unable to send quiz winner message\n', ...args));
        }
        quiz.end(bot_message, botEmbed);
      }, ANSWER_TIME_LIMIT);
    })
    .catch(() => {
      // Update the message
      const botEmbed = bot_message.embeds[0];
      quiz.end(bot_message, botEmbed);
    });
};

module.exports = {
  newQuiz,
};
