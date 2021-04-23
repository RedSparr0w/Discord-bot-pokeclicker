const { MessageEmbed } = require('discord.js');
const { getAmount, addAmount } = require('../database.js');
const { betRegex, validBet, calcBetAmount, addBetStatistics } = require('../helpers.js');
const { website, serverIcons } = require('../config.js');

const coinSides = {
  heads: 1,
  h: 1,
  tails: 0,
  t: 0,
  // Game currency
  dungeon: 1,
  dungeontoken: 1,
  d: 1,
  dt: 1,
  farm: 0,
  farmpoint: 0,
  f: 0,
  fp: 0,
};

const coinImage = {
  1: `${website}assets/images/currency/dungeonToken.png`,
  0: `${website}assets/images/currency/farmPoint.png`,
};

const flipCoin = () => Math.round(Math.random());

module.exports = {
  name        : 'flip',
  aliases     : ['coin'],
  description : 'Flip a coin for a prize',
  args        : ['amount', 'side (h|t)'],
  guildOnly   : true,
  cooldown    : 0.5,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner'],
  execute     : async (msg, args) => {
    let bet = args.find(a => betRegex.test(a));
    let side = args.find(a => new RegExp(`^(${Object.keys(coinSides).join('|')})$`, 'i').test(a));

    // Check player has selected a coin side
    if (!side || coinSides[side.toLowerCase()] == undefined) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nInvalid coin side selected.`);
      return msg.channel.send({ embed });
    }
    side = coinSides[side.toLowerCase()];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nInvalid bet amount.`);
      return msg.channel.send({ embed });
    }

    const balance = await getAmount(msg.author);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nNot enough coins.`);
      return msg.channel.send({ embed });
    }

    // Flip the coin
    const coinSide = flipCoin();
    const win = coinSide == side;

    // Calculate winnings
    const winnings = Math.floor((bet + bet) * win) - bet;

    const output = [
      msg.author,
      `**${(win ? 'WIN' : 'LOSE')}** - ${(coinSide ? 'HEADS' : 'TAILS')}`,
      `**Winnings: ${(winnings + bet).toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    addAmount(msg.author, winnings);
    addBetStatistics(msg.author, bet, winnings);

    const embed = new MessageEmbed()
      .setColor(win ? '#2ecc71' : '#e74c3c')
      .setThumbnail(coinImage[coinSide])
      .setDescription(output)
      .setFooter(`Balance: ${(balance + winnings).toLocaleString('en-US')}`);

    return msg.channel.send({ embed });
  },
};
