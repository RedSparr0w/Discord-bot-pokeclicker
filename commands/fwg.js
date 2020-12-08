const { betRegex, validBet, calcBetAmount } = require('../helpers.js');
const { MessageEmbed } = require('discord.js');
const { getAmount, addAmount } = require('../database.js');

const types = {
  f: 0,
  fire: 0,
  w: 1,
  water: 1,
  g: 2,
  grass: 2,
};

const typeIcons = {
  0: '<:fire_icon:774090473391783946>',
  1: '<:water_icon:774090473463349298>',
  2: '<:grass_icon:774090473476194325>',
};

const fwg = () => Math.floor(Math.random() * 3);

const winMultiplier = (player, bot) => {
  if (player === bot) return 1;
  if ((player + 1) % 3 === bot) return 0;
  if ((player + 2) % 3 === bot) return 2;
};

module.exports = {
  name        : 'fwg',
  aliases     : ['fgw', 'gfw', 'gwf', 'wfg', 'wgf'],
  description : 'Fire, Water, Grass _(Rock, Paper, Scissors)_',
  args        : ['amount', 'type(f|w|g)'],
  guildOnly   : true,
  cooldown    : 0.5,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (msg, args) => {
    let bet = args.find(a => betRegex.test(a));
    let type = msg.content.match(new RegExp(`([^a-z]|\\b)(${Object.keys(types).join('|')})([^a-z]|\\b)`, 'i'));

    // Check player has selected a type
    if (!type || types[type[2].toLowerCase()] == undefined) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nInvalid type selected.`);
      return msg.channel.send({ embed });
    }
    type = types[type[2].toLowerCase()];

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
    const botType = fwg();

    // Calculate winnings
    const multiplier = winMultiplier(type, botType);
    const winnings = Math.floor(bet * multiplier) - bet;

    const output = [
      msg.author,
      `__**${multiplier == 0 ? 'LOSE' : multiplier == 1 ? 'TIE' : 'WIN'}**__`,
      `${typeIcons[type]} _vs_ ${typeIcons[botType]}`,
      `**Winnings: ${(winnings + bet).toLocaleString('en-US')} <:money:737206931759824918>**`,
    ].join('\n');

    addAmount(msg.author, winnings);

    const embed = new MessageEmbed()
      .setColor(multiplier == 0 ? '#e74c3c' : multiplier == 1 ? '#3498db' : '#2ecc71')
      .setDescription(output)
      .setFooter(`Balance: ${(balance + winnings).toLocaleString('en-US')}`);

    return msg.channel.send({ embed });

  },
};
