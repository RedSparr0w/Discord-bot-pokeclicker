const { EmbedBuilder } = require('discord.js');
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
const { getRecentClaims } = require('../helpers/claim.js');
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
  cooldown    : 60,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    let { last_claim, streak, paused } = await getLastClaim(interaction.user, 'timely_claim');

    // If last claim is newer than now, just reset it to now
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
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setFooter({ text: 'Next timely' })
            .setTimestamp(time_between_claims + (+last_claim))
            .setDescription(`${interaction.user}\nYou've already claimed your ${serverIcons.money} too recently\nYou can claim again in ${timeRemaining}`),
        ],
        ephemeral: true,
      });
    }

    // Should the claim streak be reset (if more than 14 days, or 61 days if paused)
    if (last_claim < (Date.now() - ((paused ? 61 : 14) * DAY))) {
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

    const message = [`Timely Claim: **+${timelyAmount.toLocaleString('en-US')}** ${serverIcons.money}`];

    if (streakBonus) {
      message.push(`Streak Bonus: **+${streakBonus.toLocaleString('en-US')}** ${serverIcons.money} `);
    }

    roleBonuses.forEach(([r, b]) => {
      message.push(`<@&${r}>: **+${b.toLocaleString('en-US')}** ${serverIcons.money}`);
    });

    message.push(
      `Total Coins: **+${totalAmount.toLocaleString('en-US')} ${serverIcons.money}**`,
      '',
      `Current Balance: **${balance.toLocaleString('en-US')}** ${serverIcons.money}`,
      `Current Streak: **${streak + 1}**`
    );
    
    let footer = '';
    if (interaction.member.roles.cache.has(autoReminderRoleID)) {
      const reminderTime = new Date(Date.now() + time_between_claims);

      addReminder(interaction.user, reminderTime, '/timely\n<#1204292652871450696>');

      footer = 'Auto reminder will be sent in 2 hours';
    } else {
      footer = 'You can use the /roles command to be automatically reminded';
    }

    interaction.reply({
      embeds: [new EmbedBuilder().setColor('#2ecc71').setDescription(message.join('\n')).setFooter({ text: footer })],
      ephemeral: true,
    });

    // Update the bot message with the new claim amount
    const recentClaims = await getRecentClaims('timely_claim', HOUR * 2);
    const mainEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    mainEmbed.setDescription(mainEmbed.toJSON().description.replace(/2 hours: [`\d,]+/i, `2 hours: \`${recentClaims}\``));
    interaction.message.edit({ embeds: [mainEmbed] });
  },
};
