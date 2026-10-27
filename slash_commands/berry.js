const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { wikiWebsite } = require('../config.js');
const { berryType, berryList } = require('../helpers.js');

const fuzzyBerry = FuzzySet(Object.keys(berryType), false);

module.exports = {
  name        : 'berry',
  aliases     : ['berries', 'bery', 'berri', 'beri', 'berrie'],
  description : 'Get the PokéClicker wiki page for a specific Berry',
  args        : [
    {
      name: 'berryname',
      type: ApplicationCommandOptionType.String,
      description: 'Berry ID or name',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const input = interaction.options.get('berryname').value.trim();
    let berry = berryList.find(b => b.type == (+input - 1));

    if (!berry && isNaN(input)) {
      const matches = fuzzyBerry.get(input);
      if (matches) berry = berryList.find(b => b.type == +berryType[matches[0][1]]);
    }

    if (!berry) return interaction.reply({ content: 'Berry not found..', ephemeral: true });

    const name = berryType[berry.type];
    const url = `${wikiWebsite}#!${encodeURI(`Berries/${name}`)}`;
    const embed = new EmbedBuilder()
      .setTitle('PokéClicker wiki')
      .setDescription(`**[${name} Berry](${url})**`)
      .setColor('#3498db');
    interaction.reply({ embeds: [embed] });
  },
};
