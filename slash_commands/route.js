const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { wikiWebsite } = require('../config.js');
const { regionRoutes, GameConstants } = require('../helpers.js');

const fuzzyRoutes = FuzzySet(regionRoutes.map(r => r.routeName.toLowerCase()), false);
const regions = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar'];

module.exports = {
  name        : 'route',
  aliases     : ['routes', 'routeinfo', 'r'],
  description : 'Get the PokéClicker wiki page for a specific route',
  args        : [
    {
      name: 'name',
      type: ApplicationCommandOptionType.String,
      description: 'Route number/name',
      required: true,
    },
    {
      name: 'region',
      type: ApplicationCommandOptionType.Integer,
      description: 'Region name',
      required: false,
      choices: regions.map((name, value) => ({ name, value })),
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const input = interaction.options.get('name').value.trim();
    const regionID = interaction.options.get('region')?.value;
    const routes = regionRoutes.filter(route => regionID == undefined || route.region == regionID);
    let route = routes.find(route => route.routeName.toLowerCase().endsWith(` ${input.toLowerCase()}`));

    if (!route) {
      const matches = fuzzyRoutes.get(input);
      if (matches) route = routes.find(route => route.routeName.toLowerCase() == matches[0][1]);
    }

    if (!route) {
      const region = regionID == undefined ? '' : ` in ${GameConstants.Region[regionID]}`;
      return interaction.reply({ content: `Route not found${region}..`, ephemeral: true });
    }

    const url = `${wikiWebsite}#!${encodeURI(`Routes/${route.routeName}`)}`;
    const embed = new EmbedBuilder()
      .setTitle('PokéClicker wiki')
      .setDescription(`**[${route.routeName}](${url})**`)
      .setColor('#3498db');
    interaction.reply({ embeds: [embed] });
  },
};
