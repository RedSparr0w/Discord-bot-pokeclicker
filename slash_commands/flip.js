const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
const { getAmount, addAmount } = require('../database.js');
const { validBet, calcBetAmount, addBetStatistics } = require('../helpers.js');
const { serverIcons } = require('../config.js');

const coinSides = {
  heads: 1,
  tails: 0,
};

const coinImage = {
  [coinSides.heads]: 'assets/images/currency/dungeonToken.png',
  [coinSides.tails]: 'assets/images/currency/farmPoint.png',
};

const flipCoin = () => Math.round(Math.random());

module.exports = {
  name        : 'flip',
  aliases     : ['coin'],
  description : 'Flip a coin and bet some PokéCoins',
  args        : [
    {
      name: 'bet-amount',
      type: ApplicationCommandOptionType.String,
      description: 'How much money you want to bet',
      required: true,
    },
    {
      name: 'coin-side',
      type: ApplicationCommandOptionType.String,
      description: 'Which side of the coin are you betting on',
      required: true,
      choices: [
        {
          name: 'Heads',
          value: 'heads',
        },
        {
          name: 'Tails',
          value: 'tails',
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 0.5,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['game-corner'],
  execute     : async (interaction) => {
    let bet = interaction.options.get('bet-amount').value;
    let side = interaction.options.get('coin-side').value;

    // Check player has selected a coin side
    side = coinSides[side.toLowerCase()];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid bet amount.`, { ephemeral: true });
      return interaction.reply({ embeds: [embed] });
    }

    const balance = await getAmount(interaction.user);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`${interaction.user}\nNot enough coins.`, { ephemeral: true });
      return interaction.reply({ embeds: [embed] });
    }

    // Flip the coin
    const coinSide = flipCoin();
    const win = coinSide == side;

    // Calculate winnings
    const winnings = Math.floor((bet + bet) * win) - bet;

    const output = [
      interaction.user,
      `**${(win ? 'WIN' : 'LOSE')}** - ${(coinSide ? 'HEADS' : 'TAILS')}`,
      `**Winnings: ${(winnings + bet).toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const files = await new AttachmentBuilder().setFile(coinImage[coinSide]).setName('coin.png');

    const embed = new EmbedBuilder()
      .setColor(win ? '#2ecc71' : '#e74c3c')
      .setThumbnail(`attachment://coin.png`)
      .setDescription(output)
      .setFooter({ text: `Balance: ${(balance + winnings).toLocaleString('en-US')}` });

    return interaction.reply({ embeds: [embed], files: [files] });
  },
};
