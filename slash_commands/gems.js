const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { wikiWebsite } = require('../config.js');

module.exports = {
  name        : 'gems',
  aliases     : ['gem', 's', 'shard'],
  description : 'Get the PokéClicker wiki page for a particular type of gem',
  args        : [
    {
      name: 'type',
      type: ApplicationCommandOptionType.String,
      description: 'Gem type',
      required: true,
      choices: [
        { name: 'Normal', value: 'Normal' },
        { name: 'Fire', value: 'Fire' },
        { name: 'Water', value: 'Water' },
        { name: 'Electric', value: 'Electric' },
        { name: 'Grass', value: 'Grass' },
        { name: 'Ice', value: 'Ice' },
        { name: 'Fighting', value: 'Fighting' },
        { name: 'Poison', value: 'Poison' },
        { name: 'Ground', value: 'Ground' },
        { name: 'Flying', value: 'Flying' },
        { name: 'Psychic', value: 'Psychic' },
        { name: 'Bug', value: 'Bug' },
        { name: 'Rock', value: 'Rock' },
        { name: 'Ghost', value: 'Ghost' },
        { name: 'Dragon', value: 'Dragon' },
        { name: 'Dark', value: 'Dark' },
        { name: 'Steel', value: 'Steel' },
        { name: 'Fairy', value: 'Fairy' },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const type = interaction.options.get('type').value;
    const url = `${wikiWebsite}#!${encodeURI(`Gems/${type}`)}`;
    const embed = new EmbedBuilder()
      .setTitle('PokéClicker wiki')
      .setDescription(`**[${type} Gem](${url})**`)
      .setColor('#3498db');
    interaction.reply({ embeds: [embed] });
  },
};
