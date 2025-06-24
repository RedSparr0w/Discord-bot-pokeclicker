const { EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { getLastClaim } = require('../helpers.js');
const { getStatistic } = require('../database.js');

module.exports = {
  type        : ApplicationCommandType.User,
  name        : 'statistics',
  aliases     : ['stats'],
  description : 'Get an overview of your statistics for this server',
  args        : [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'Get another users statistics',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands', 'game-corner'],
  execute     : async (interaction) => {
    const id = interaction.options.get('user')?.value;

    let user = interaction.user;

    if (id) {
      const member = await interaction.member.guild.members.fetch(id).catch(e => {});
      if (!member) {
        const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid user ID specified.`);
        return interaction.reply({ embeds: [embed] });
      }
      user = member.user;
    }

    const embed = new EmbedBuilder()
      .setTitle('Statistics')
      .setDescription(user.toString())
      .setColor('#3498db');

    const [
      messages,
      commands,
      // Other
      daily_claim,
      timely_claim,
      clicks,
      // Games Corner
      gc_games_played,
      gc_games_won,
      gc_games_tied,
      gc_games_lost,
      gc_coins_bet,
      gc_coins_won,
      hm_correct_guesses,
      hm_wrong_guesses,
      // Quiz
      qz_answered,
      qz_coins_won,
    ] = await Promise.all([
      getStatistic(user, 'messages'),
      getStatistic(user, 'commands'),
      getLastClaim(user, 'daily_claim'),
      getLastClaim(user, 'timely_claim'),
      getStatistic(user, 'clicks'),
      // Games Corner
      getStatistic(user, 'gc_games_played'),
      getStatistic(user, 'gc_games_won'),
      getStatistic(user, 'gc_games_tied'),
      getStatistic(user, 'gc_games_lost'),
      getStatistic(user, 'gc_coins_bet'),
      getStatistic(user, 'gc_coins_won'),
      getStatistic(user, 'hm_correct_guesses'),
      getStatistic(user, 'hm_wrong_guesses'),
      // Quiz
      getStatistic(user, 'qz_answered'),
      getStatistic(user, 'qz_coins_won'),
    ]);

    embed.addFields({
      name: '__***#general***__',
      value: [
        `**❯ Messages:** ${messages.toLocaleString('en-US')}`,
        `**❯ Commands:** ${commands.toLocaleString('en-US')}`,
      ].join('\n'),
    });

    embed.addFields({
      name: '__***#claims***__',
      value: [
        `**❯ Claim:** ${daily_claim.streak.toLocaleString('en-US')}`,
        `**❯ Timely:** ${timely_claim.streak.toLocaleString('en-US')}`,
        `**❯ Clicks:** ${clicks.toLocaleString('en-US')}`,
      ].join('\n'),
    });

    embed.addFields({
      name: '__***#game-corner***__',
      value: [
        `**❯ Games Played:** ${gc_games_played.toLocaleString('en-US')}`,
        `**❯ Games Won:** ${gc_games_won.toLocaleString('en-US')}`,
        `**❯ Games Tied:** ${gc_games_tied.toLocaleString('en-US')}`,
        `**❯ Games Lost:** ${gc_games_lost.toLocaleString('en-US')}`,
        `**❯ Coins Bet:** ${gc_coins_bet.toLocaleString('en-US')}`,
        `**❯ Coins Won:** ${gc_coins_won.toLocaleString('en-US')}`,
        `**❯ Hangmon 🟢:** ${hm_correct_guesses.toLocaleString('en-US')}`,
        `**❯ Hangmon 🔴:** ${hm_wrong_guesses.toLocaleString('en-US')}`,
      ].join('\n'),
    });

    embed.addFields({
      name: '__***#bot-coins***__',
      value: [
        `**❯ Q's Answered:** ${qz_answered.toLocaleString('en-US')}`,
        `**❯ Coins Won:** ${qz_coins_won.toLocaleString('en-US')}`,
      ].join('\n'),
    });


    return interaction.reply({ embeds: [embed] });
  },
};
