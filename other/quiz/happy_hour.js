const { MessageEmbed } = require('discord.js');
const { quizChannelID } = require('../../config.js');
const { HOUR } = require('../../helpers.js');

const happyHourBonus = 6;
const happyHourHours = 7;
const isHappyHour = () => Date.now() % (happyHourHours * HOUR) < HOUR;
const nextHappyHour = (now = new Date()) => new Date((now - (now % (happyHourHours * HOUR))) + happyHourHours * HOUR);

const startHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;
  // players can type as fast as they want
  quiz_channel.setRateLimitPerUser(0, 'Happy Hour!').catch(O_o=>{});
  setTimeout(() => quiz_channel.setRateLimitPerUser(5, 'Happy Hour!').catch(O_o=>{}), HOUR);

  const embed = new MessageEmbed()
    .setTitle('It\'s Happy Hour!')
    .setDescription(['Happy Hour is on for the next 1 hour!', `Questions are posted ${happyHourBonus} × as often`, `Shiny chances are ${happyHourBonus} × higher`, '', 'Good Luck!'].join('\n'))
    .setColor('#2ecc71');

  return await quiz_channel.send({ content: '<@&788190728027242496>', embeds: [embed] });
};

const endHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;
  // players can only type once per 5 seconds
  quiz_channel.setRateLimitPerUser(5, 'Happy Hour!').catch(O_o=>{});

  const embed = new MessageEmbed()
    .setTitle('Happy Hour is over!')
    .setDescription(['The next happy hour will be:'].join('\n'))
    .setTimestamp(nextHappyHour())
    .setColor('#e74c3c');

  return await quiz_channel.send({ embeds: [embed] });
};

module.exports = {
  happyHourBonus,
  happyHourHours,
  isHappyHour,
  nextHappyHour,
  startHappyHour,
  endHappyHour,
};
