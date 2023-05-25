const { EmbedBuilder } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { wikiWebsite } = require('../config.js');
const { wikiLinks } = require('../helpers.js');
const fuzzyWiki = FuzzySet(wikiLinks.map(p => p.title.toLowerCase()), false);

module.exports = {
  name        : 'wiki',
  aliases     : [],
  description : 'Links to the PokéClicker wiki or a specific page',
  args        : [
    {
      name: 'query',
      type: 'STRING',
      description: 'Link to something specifically on the wiki',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    const search = interaction.options.get('query')?.value;

    if (!search) {
      const embed = new EmbedBuilder()
        .setTitle('PokéClicker wiki')
        .setDescription(`Wiki: ${wikiWebsite}\nBeta Wiki: https://wiki.pokeclicker.com\n\nTo search for a specific page, use \`/wiki <query>\``)
        .setColor('#e74c3c');
      return interaction.reply({ embeds: [embed] });
    }

    const title = fuzzyWiki.get(search);

    if (!title) {
      const embed = new EmbedBuilder()
        .setTitle('PokéClicker wiki')
        .setDescription('No matching pages found')
        .setColor('#e74c3c');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const links = title.map(([match, title]) => wikiLinks.find((link) => link.title.toLowerCase() == title));
    const topLink = links.shift();

    const embed = new EmbedBuilder()
      .setTitle('PokéClicker wiki')
      .setDescription(`**Top result:**
      **[${topLink.title}](${topLink.link})**
      ${!links.length ? '' : `\nSimilar:\n${links.map(link => `[${link.title}](${link.link})`).join('\n')}`}`)
      .setColor('#3498db');
    return interaction.reply({ embeds: [embed] });
  },
};
