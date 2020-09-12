const { MessageEmbed } = require('discord.js');
const { addAmount } = require('../database.js');
const {
  getLastClaim,
  updateClaimDate,
  bumpClaimStreak,
  resetClaimStreak,
} = require('../helpers.js');

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

// maximum of 10, 1 extra per streak
const calcStreakBonus = (streak) => Math.max(0, Math.min(10, streak));

module.exports = {
  name        : 'timely',
  aliases     : [],
  description : 'Claim your 2 hourly coins',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    // Check if user claimed within the last 24 hours
    let { last_claim, streak } = await getLastClaim(msg.author, 'timely_claim');

    // User already claimed within last 2 hours
    if (last_claim >= (Date.now() - (2 * HOUR))) {
      const time_left = (+last_claim + (2 * HOUR)) - Date.now();
      const hours = Math.floor(time_left % DAY / HOUR);
      const minutes = Math.floor(time_left % HOUR / MINUTE);
      const seconds = Math.floor(time_left % MINUTE / SECOND);
      let timeRemaining = '';
      if (+hours) timeRemaining += `${hours} hours `;
      if (+hours || +minutes) timeRemaining += `${minutes} minutes `;
      timeRemaining += `${seconds} seconds`;
      return msg.channel.send({
        embed: new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nYou've already claimed your <:money:737206931759824918> too recently\nYou can claim again in ${timeRemaining}`),
      });
    }

    // Should the claim streak be reset (if more than 1 day)
    if (last_claim < (Date.now() - DAY)) {
      await resetClaimStreak(msg.author, 'timely_claim');
      streak = 0;
    }

    // Add the coins to the users balance, set last claimed time
    const timelyAmount = 10 + calcStreakBonus(streak);
    // Add the balance then set last claim time (incase the user doesn't exist yet)
    const balance = await addAmount(msg.author, timelyAmount, 'coins');
    await updateClaimDate(msg.author, 'timely_claim');
    await bumpClaimStreak(msg.author, 'timely_claim');
    return msg.channel.send({
      embed: new MessageEmbed().setColor('#2ecc71').setDescription(`${msg.author}\n**+${timelyAmount.toLocaleString('en-US')}** <:money:737206931759824918>\n\nCurrent Balance: **${balance.toLocaleString('en-US')}** <:money:737206931759824918>\nCurrent Streak: **${streak + 1}**`),
    });
  },
};
