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
const time_between_claims = 2 * HOUR;

const timelyAmount = 10;

const calcStreakBonus = (streak) => {
  const bigStreak = Math.max(0, Math.min(10, streak));
  streak -= bigStreak;
  const midStreak = Math.max(0, Math.min(50, streak));
  streak -= midStreak;
  return bigStreak + Math.floor(midStreak * 0.2) + Math.floor(streak * 0.05);
};

const s = (amt) => amt != 1 ? 's' : '';

module.exports = {
  name        : 'timely',
  aliases     : [],
  description : 'Claim your 2 hourly PokéCoins',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    // Check if user claimed within the last 24 hours
    let { last_claim, streak, paused } = await getLastClaim(interaction.user, 'timely_claim');

    if (last_claim > Date.now()) {
      last_claim = Date.now() - (time_between_claims + 1000);
    }

    // User already claimed within last 2 hours
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
          new MessageEmbed()
            .setColor('#e74c3c')
            .setFooter({ text: 'Next timely' })
            .setTimestamp(time_between_claims + (+last_claim))
            .setDescription(`${interaction.user}\nYou've already claimed your ${serverIcons.money} too recently\nYou can claim again in ${timeRemaining}`),
        ],
      });
    }

    // Should the claim streak be reset (if more than 4 days, or 14 days if paused)
    if (last_claim < (Date.now() - ((paused ? 14 : 4) * DAY))) {
      await resetClaimStreak(interaction.user, 'timely_claim');
      streak = 0;
    }

    // Calculate bonuses
    const streakBonus = calcStreakBonus(streak);
    let totalAmount = timelyAmount + streakBonus;
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
    await updateClaimDate(interaction.user, 'timely_claim');
    await bumpClaimStreak(interaction.user, 'timely_claim');

    const message = [
      interaction.user,
      `_Timely Claim:_ **+${timelyAmount.toLocaleString('en-US')}** ${serverIcons.money}`,
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
      const reminderTime = new Date(Date.now() + HOUR * 2);

      addReminder(interaction.user, reminderTime, '/timely\n<#456798288893706241>');

      message.push('', 'Auto reminder will be sent in 2 hours');
    } else {
      message.push('', '_You can use the `/roles` command to be automatically reminded_');
    }

    return interaction.reply({
      embeds: [new MessageEmbed().setColor('#2ecc71').setDescription(message.join('\n'))],
    });
  },
};
