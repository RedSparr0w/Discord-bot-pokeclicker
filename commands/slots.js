const { MessageEmbed } = require('discord.js');
const { getAmount, addAmount } = require('../database.js');
const { validBet, calcBetAmount } = require('../helpers.js');

const multipliers = [
  300,
  100,
  15,
  15,
  8,
  8,
];
const icons       = [
  '<:slots_7:751322075578499093>',
  '<:slots_r:751322076115370044>',
  '<:slots_pikachu:751322076031483944>',
  '<:slots_psyduck:751322076052455444>',
  '<:slots_magnemite:751322076014706698>',
  '<:slot_shelder:751322075481768027>',
  '<:slots_berry:751322075955724368>',
];

const spinSlots = () => {
  const spinIcons = [[],[],[]];
  spinIcons.forEach((col, index) => {
    const column = [...icons];
    if (index == 2) column.splice(column.length - 1);
    while (col.length < 3) {
      col.push(column.splice(Math.floor(Math.random() * column.length), 1)[0]);
    }
  });
  return spinIcons;
};

const calcWinningsMultiplier = (slotIcons, lines) => {
  let multiplier = 0;

  const row1 = slotIcons.map(r => r[0]);
  const row2 = slotIcons.map(r => r[1]);
  const row3 = slotIcons.map(r => r[2]);

  // Each Row
  if (lines >= 2 && new Set(row1).size == 1) multiplier += multipliers[icons.findIndex(i => i == row1[0])];
  if (new Set(row2).size == 1) multiplier += multipliers[icons.findIndex(i => i == row2[0])];
  if (lines >= 2 && new Set(row3).size == 1) multiplier += multipliers[icons.findIndex(i => i == row3[0])];

  // Both Diagonals
  if (lines >= 3 && new Set([row1[0], row2[1], row3[2]]).size == 1) multiplier += multipliers[icons.findIndex(i => i == row1[0])];
  if (lines >= 3 && new Set([row3[0], row2[1], row1[2]]).size == 1) multiplier += multipliers[icons.findIndex(i => i == row3[0])];

  // Berries
  const berry = icons[6];
  if (lines >= 2 && row1[0] == berry) {
    if (row1[1] == berry) multiplier += 6;
    else if (lines >= 3 && row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }
  if (row2[0] == berry) {
    if (row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }
  if (lines >= 2 && row3[0] == berry) {
    if (row3[1] == berry) multiplier += 6;
    else if (lines >= 3 && row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }

  return Math.floor((multiplier / lines) * 100) / 100;
};

module.exports = {
  name        : 'slots',
  aliases     : ['slot'],
  description : 'Spin the slots for a prize',
  helpFields: [
    [
      '❯ Lines:',
      [
        '**`1 Line:`** The middle line across',
        '**`2 Lines:`** All 3 lines across',
        '**`3 Lines:`** All 3 lines across and both diagonal lines',
      ],
    ],
    [
      '❯ Multipliers:',
      [
        `${icons.filter((icon, index) => multipliers[index]).map((icon, index) => `${icon}${icon}${icon} ║ **× ${multipliers[index]}**`).join('\n')}`,
        `${icons[icons.length - 1]}${icons[icons.length - 1]}➖ ║ **× 6**`,
        `${icons[icons.length - 1]}➖➖ ║ **× 2**`,
        '',
        '_**Note:** The multiplier is divided by however many lines you are playing._',
      ],
    ],
  ],
  args        : ['amount', 'lines(3)?'],
  guildOnly   : true,
  cooldown    : 0.5,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let [ bet, lines = 3 ] = args;

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nInvalid bet amount: \`${bet}\``);
      return msg.channel.send({ embed });
    }

    const balance = await getAmount(msg.author);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription(`${msg.author}\nNot enough coins.`);
      return msg.channel.send({ embed });
    }

    // Check the player has entered a correct amount of lines
    if (!lines || isNaN(lines) || lines > 3 || lines < 1) lines = 3;

    const slotIcons = spinSlots();

    const multiplier = calcWinningsMultiplier(slotIcons, lines);
    const winnings = Math.floor(bet * multiplier);

    const output = [
      msg.author,
      '',
      `║ ${slotIcons.map(r => r[0]).join(' ║ ')} ║`,
      `║ ${slotIcons.map(r => r[1]).join(' ║ ')} ║`,
      `║ ${slotIcons.map(r => r[2]).join(' ║ ')} ║`,
      '',
      `**Winnings: ${winnings.toLocaleString('en-US')} <:money:737206931759824918>**`,
    ];

    addAmount(msg.author, winnings - bet);

    const embed = new MessageEmbed()
      .setColor(multiplier >= 1 ? '#2ecc71' : '#e74c3c')
      .setDescription(output)
      .setFooter(`Balance: ${(balance + winnings - bet).toLocaleString('en-US')}`);
    return msg.channel.send({ embed });
  },
};
