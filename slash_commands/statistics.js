const { MessageEmbed } = require('discord.js');
const { getStatistic } = require('../database.js');

module.exports = {
  type        : 'USER',
  name        : 'statistics',
  aliases     : ['stats'],
  description : 'Get an overview of your statistics for this server',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'Get another users statistics',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands', 'game-corner'],
  execute     : async (interaction) => {
    const id = interaction.options.get('user')?.value;

    let user = interaction.user;

    if (id) {
      const member = await interaction.member.guild.members.fetch(id).catch(e => {});
      if (!member) {
        const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid user ID specified.`);
        return interaction.reply({ embeds: [embed] });
      }
      user = member.user;
    }

    const embed = new MessageEmbed()
      .setTitle('Statistics')
      .setDescription(user.toString())
      .setColor('#3498db');

    const [
      messages,
      commands,
      // Games Corner
      gc_games_played,
      gc_games_won,
      gc_games_tied,
      gc_games_lost,
      gc_coins_bet,
      gc_coins_won,
      // Quiz
      qz_answered,
      qz_coins_won,
    ] = await Promise.all([
      getStatistic(user, 'messages'),
      getStatistic(user, 'commands'),
      // Games Corner
      getStatistic(user, 'gc_games_played'),
      getStatistic(user, 'gc_games_won'),
      getStatistic(user, 'gc_games_tied'),
      getStatistic(user, 'gc_games_lost'),
      getStatistic(user, 'gc_coins_bet'),
      getStatistic(user, 'gc_coins_won'),
      // Quiz
      getStatistic(user, 'qz_answered'),
      getStatistic(user, 'qz_coins_won'),
    ]);

    embed.addField('__***#general***__', [
      `**❯ Messages:** ${messages.toLocaleString('en-US')}`,
      `**❯ Commands:** ${commands.toLocaleString('en-US')}`,
    ].join('\n'));

    embed.addField('__***#game-corner***__', [
      `**❯ Games Played:** ${gc_games_played.toLocaleString('en-US')}`,
      `**❯ Games Won:** ${gc_games_won.toLocaleString('en-US')}`,
      `**❯ Games Tied:** ${gc_games_tied.toLocaleString('en-US')}`,
      `**❯ Games Lost:** ${gc_games_lost.toLocaleString('en-US')}`,
      `**❯ Coins Bet:** ${gc_coins_bet.toLocaleString('en-US')}`,
      `**❯ Coins Won:** ${gc_coins_won.toLocaleString('en-US')}`,
    ].join('\n'));

    embed.addField('__***#bot-coins***__', [
      `**❯ Q's Answered:** ${qz_answered.toLocaleString('en-US')}`,
      `**❯ Coins Won:** ${qz_coins_won.toLocaleString('en-US')}`,
    ].join('\n'));


    return interaction.reply({ embeds: [embed] });
  },
};
