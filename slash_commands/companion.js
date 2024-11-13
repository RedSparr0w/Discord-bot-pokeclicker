const { EmbedBuilder } = require('discord.js');

module.exports = {
  name        : 'companion',
  aliases     : [],
  description : 'Link to the PokéClicker Companion website',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    const embed = new EmbedBuilder()
      .setDescription('Check out the [PokéClicker Companion](https://companion.pokeclicker.com/) website for some useful tools!')
      .setColor('#3498db');
    return interaction.reply({ embeds: [embed] });
  },
};
