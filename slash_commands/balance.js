const { EmbedBuilder } = require('discord.js');
const { getAmount } = require('../database.js');
const { serverIcons } = require('../config.js');

module.exports = {
  name        : 'balance',
  aliases     : ['bal', '$'],
  description : 'Get your current PokéCoin balance',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands', 'bragging'],
  execute     : async (interaction) => {
    const balance = await getAmount(interaction.user);

    const output = [
      interaction.user,
      `**Balance: ${balance.toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setDescription(output);

    return interaction.reply({ embeds: [embed] });
  },
};
