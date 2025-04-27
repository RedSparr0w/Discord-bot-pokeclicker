const { EmbedBuilder, AttachmentBuilder, ApplicationCommandOptionType } = require('discord.js');
const { serverIcons } = require('../config.js');

const iconMap = {
  '-2' : serverIcons.mineBombShiny ?? '💥',
  '-1' : serverIcons.mineBomb ?? '🧨',
  '0' : '🟩',
  '1' : '1️⃣',
  '2' : '2️⃣',
  '3' : '3️⃣',
  '4' : '4️⃣',
  '5' : '5️⃣',
  '6' : '6️⃣',
  '7' : '7️⃣',
  '8' : '8️⃣',
};
const shinyChance = 54;
const getBombType = () => !Math.floor(Math.random() * shinyChance) ? -2 : -1;

module.exports = {
  name        : 'minesweeper',
  aliases     : ['mine', 'mine-sweeper'],
  description : 'Generate a game of Mine Sweeper to play',
  args        : [
    {
      name: 'x-size',
      type: ApplicationCommandOptionType.Integer,
      description: 'How big you want the board to be',
      required: true,
    },
    {
      name: 'bombs',
      type: ApplicationCommandOptionType.Integer,
      description: 'How many bombs on the field',
      required: false,
    },
    {
      name: 'y-size',
      type: ApplicationCommandOptionType.Integer,
      description: 'How big you want the board to be',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 60, // Long cooldown because too many boards make Discord app run slower
  botperms    : ['SendMessages'],
  userperms   : [],
  channels    : ['game-corner'],
  execute     : async (interaction) => {
    const xSize = interaction.options.get('x-size').value;
    let ySize = interaction.options.get('y-size')?.value;
    let bombs = interaction.options.get('bombs')?.value;

    // Either the player specified the y-size, or we set it equal to the xSize
    ySize = ySize ?? xSize;
    // Either the player specified the amount of bombs, or we randomly set it to 10-20% of the board
    bombs = bombs ?? Math.round((Math.random() * 10 + 10) / 100 * xSize * ySize);

    // Check the amount of bombs is valid
    if (xSize * ySize - bombs <= 1) {
      return interaction.reply({ content : `❌ Too many bombs: retry with different parameters.`, ephemeral : true });
    }
    // Unfortunately, Discord limits messages to 99 spoiler tags.
    if (xSize * ySize >= 100) {
      return interaction.reply({ content : `❌ Board is too large: At most 99 tiles allowed.`, ephemeral : true });
    }

    const d2Map = [...new Array(bombs).fill(-1).map(_ => getBombType()), ...new Array(xSize * ySize - bombs).fill(0)];
    const board = [];
    // Fill our board
    while (d2Map.length) {
      const row = [];
      while (row.length < ySize) {
        const randIndex = Math.floor(Math.random() * d2Map.length);
        row.push(...d2Map.splice(randIndex, 1));
      }
      board.push(row);
    }

    // Count neighbour bombs
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell >= 0) {
          board[y][x] = [
              [y - 1, x - 1],
              [y - 1, x],
              [y - 1, x + 1],
              [y, x + 1],
              [y + 1, x + 1],
              [y + 1, x],
              [y + 1, x - 1],
              [y, x - 1],
          ].reduce((b, coos) => b + (board[coos[0]]?.[coos[1]] < 0), 0);
        }
      });
    });
    const stringified = `Tiles: ${xSize * ySize}, Bombs: ${bombs}\n${board.map(row => row.map(c => `||${iconMap[c]}||`).join('')).join('\n')}`;

    if (stringified.length >= 2000) {
      return interaction.reply({ content : `❌ The board is too large to be displayed in Discord.`, ephemeral : true });
    }
    return interaction.reply({ content :  stringified });
  },
};
