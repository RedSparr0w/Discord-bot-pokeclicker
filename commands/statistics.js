const { MessageEmbed } = require('discord.js');
const { getStatistic } = require('../database.js');

module.exports = {
  name        : 'statistics',
  aliases     : ['stats'],
  description : 'Get an overview of your statistics for this server',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (msg, args) => {
    const user = msg.author;

    const embed = new MessageEmbed()
      .setTitle('Statistics')
      .setDescription(user)
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
    ]);

    embed.addField('__***#games-corner***__', [
      `**❯ Games Played:** ${gc_games_played.toLocaleString('en-US')}`,
      `**❯ Games Won:** ${gc_games_won.toLocaleString('en-US')}`,
      `**❯ Games Tied:** ${gc_games_tied.toLocaleString('en-US')}`,
      `**❯ Games Lost:** ${gc_games_lost.toLocaleString('en-US')}`,
      `**❯ Coins Bet:** ${gc_coins_bet.toLocaleString('en-US')}`,
      `**❯ Coins Won:** ${gc_coins_won.toLocaleString('en-US')}`,
    ]);

    embed.addField('__***#bot-quiz***__', [
      `**❯ Q's Answered:** ${qz_answered.toLocaleString('en-US')}`,
      `**❯ Coins Won:** ${qz_coins_won.toLocaleString('en-US')}`,
    ]);


    return msg.channel.send({ embed });
  },
};
