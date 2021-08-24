const { MessageEmbed } = require('discord.js');
const { addAmount, addReminder } = require('../database.js');
const { bonusRoles, serverIcons, autoReminderRoleID } = require('../config.js');
const {
  getLastClaim,
  updateClaimDate,
  bumpClaimStreak,
  resetClaimStreak,
  warn,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
} = require('../helpers.js');
const time_between_claims = 23 * HOUR;

const claimAmount = 100;

const calcStreakBonus = (streak) => {
  const bigStreak = Math.max(0, Math.min(5, streak));
  streak -= bigStreak;
  const midStreak = Math.max(0, Math.min(10, streak));
  streak -= midStreak;
  return (bigStreak * 10) + (midStreak * 5) + streak;
};

const s = (amt) => amt != 1 ? 's' : '';

module.exports = {
  name        : 'claim',
  aliases     : ['daily'],
  description : 'Claim your daily PokéCoins',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    // Check if user claimed within the last 24 hours
    let { last_claim, streak } = await getLastClaim(interaction.user, 'daily_claim');

    // User already claimed within last 23 hours
    if (last_claim >= (Date.now() - time_between_claims)) {
      const time_left = (+last_claim + time_between_claims) - Date.now();
      const hours = Math.floor(time_left % DAY / HOUR);
      const minutes = Math.floor(time_left % HOUR / MINUTE);
      const seconds = Math.floor(time_left % MINUTE / SECOND);
      let timeRemaining = '';
      if (+hours) timeRemaining += `${hours} hour${s(hours)} `;
      if (+hours || +minutes) timeRemaining += `${minutes} minute${s(minutes)} `;
      timeRemaining += `${seconds} second${s(seconds)}`;
      return interaction.reply({
        embeds: [
          new MessageEmbed().setColor('#e74c3c').setFooter('Next claim').setTimestamp(time_between_claims + (+last_claim))
            .setDescription(`${interaction.user}\nYou've already claimed your ${serverIcons.money} for today\nYou can claim again in ${timeRemaining}`),
        ],
      });
    }

    // Should the claim streak be reset (if more than 2 days)
    if (last_claim < (Date.now() - (3 * DAY))) {
      await resetClaimStreak(interaction.user, 'daily_claim');
      streak = 0;
    }

    // Calculate bonuses
    const streakBonus = calcStreakBonus(streak);
    let totalAmount = claimAmount + streakBonus;
    const roleBonuses = [];
    try {
      interaction.member.roles.cache.map(r => r.id).forEach(roleID => {
        const bonus = bonusRoles[roleID];
        if (bonus) {
          roleBonuses.push([roleID, Math.floor(totalAmount * bonus)]);
        }
      });
    } catch (e) {
      warn('something went wrong calculating role claim bonuses', e);
    }
    totalAmount += roleBonuses.reduce((a, [r, b]) => a + b, 0);

    // Add the coins to the users balance then set last claim time (incase the user doesn't exist yet)
    const balance = await addAmount(interaction.user, totalAmount, 'coins');
    await updateClaimDate(interaction.user, 'daily_claim');
    await bumpClaimStreak(interaction.user, 'daily_claim');

    const message = [
      interaction.user,
      `_Daily Claim:_ **+${claimAmount.toLocaleString('en-US')}** ${serverIcons.money}`,
    ];

    if (streakBonus) {
      message.push(`_Streak Bonus:_ **+${streakBonus.toLocaleString('en-US')}** ${serverIcons.money} `);
    }

    roleBonuses.forEach(([r, b]) => {
      message.push(`_<@&${r}>:_ **+${b.toLocaleString('en-US')}** ${serverIcons.money}`);
    });

    message.push(
      '',
      `Current Balance: **${balance.toLocaleString('en-US')}** ${serverIcons.money}`,
      `Current Streak: **${streak + 1}**`
    );
    
    if (interaction.member.roles.cache.has(autoReminderRoleID)) {
      const reminderTime = new Date();
      reminderTime.setHours(reminderTime.getHours() + 23);

      addReminder(interaction.user, reminderTime, '/claim');

      message.push('', 'Auto reminder will be sent in 23 hours');
    }

    return interaction.reply({
      embeds: [new MessageEmbed().setColor('#2ecc71').setDescription(message.join('\n'))],
    });
  },
};
