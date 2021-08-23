const { MessageEmbed } = require('discord.js');
const { getAmount } = require('../database.js');
const { serverIcons } = require('../config.js');

module.exports = {
  type        : 'interaction',
  name        : 'balance',
  aliases     : ['bal', '$'],
  description : 'Get your current balance',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner', 'bot-commands', 'bragging'],
  execute     : async (interaction) => {
    const balance = await getAmount(interaction.user);

    const output = [
      interaction.user,
      `**Balance: ${balance.toLocaleString('en-US')} ${serverIcons.money}**`,
    ].join('\n');

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(output);

    return interaction.reply({ embeds: [embed] });
  },
};