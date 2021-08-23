const { validBet, calcBetAmount, addBetStatistics } = require('../helpers.js');
const { MessageEmbed } = require('discord.js');
const { getAmount, addAmount } = require('../database.js');
const { serverIcons } = require('../config.js');

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
  name        : 'fire-water-grass',
  aliases     : ['fgw', 'gfw', 'gwf', 'wfg', 'wgf', 'fire-water-grass'],
  description : 'Fire, Water, Grass (Rock, Paper, Scissors) bet some PokéCoins',
  args        : [
    {
      name: 'bet-amount',
      type: 'STRING',
      description: 'How much money you want to bet',
      required: true,
    },
    {
      name: 'type',
      type: 'STRING',
      description: 'Which type are you betting on',
      required: true,
      choices: [
        {
          name: 'Fire',
          value: 'fire',
        },
        {
          name: 'Water',
          value: 'water',
        },
        {
          name: 'Grass',
          value: 'grass',
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 0.5,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner'],
  execute     : async (interaction) => {
    let bet = interaction.options.get('bet-amount').value;
    let type = interaction.options.get('type').value;

    // Check player has selected a type
    if (!type || types[type.toLowerCase()] == undefined) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid type selected.`);
      return interaction.reply({ embeds: [embed] });
    }
    type = types[type.toLowerCase()];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid bet amount.`);
      return interaction.reply({ embeds: [embed] });
    }

    const balance = await getAmount(interaction.user);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${interaction.user}\nNot enough coins.`);
      return interaction.reply({ embeds: [embed] });
    }

    // Flip the coin
    const botType = fwg();

    // Calculate winnings
    const multiplier = winMultiplier(type, botType);
    const winnings = Math.floor(bet * multiplier) - bet;

    const output = [
      interaction.user,
      `__**${multiplier == 0 ? 'LOSE' : multiplier == 1 ? 'TIE' : 'WIN'}**__`,
      `${typeIcons[type]} _vs_ ${typeIcons[botType]}`,
      `**Winnings: ${(winnings + bet).toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const embed = new MessageEmbed()
      .setColor(multiplier == 0 ? '#e74c3c' : multiplier == 1 ? '#3498db' : '#2ecc71')
      .setDescription(output)
      .setFooter(`Balance: ${(balance + winnings).toLocaleString('en-US')}`);

    return interaction.reply({ embeds: [embed] });

  },
};
