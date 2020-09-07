const { MessageEmbed } = require('discord.js');
const {
  regionRoutes,
  pokemonList,
  RouteShardTypes,
  PokemonType,
  pokemonTypeIcons,
  gameVersion,
  GameConstants,
} = require('../helpers.js');
const { website } = require('../config.json');

module.exports = {
  name        : 'route',
  aliases     : ['routes', 'routeinfo'],
  description : 'Get PokéClicker game info about a specific Pokémon',
  args        : ['id', 'region?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const [routeNumber, region] = args;
    if (isNaN(routeNumber)) return msg.reply(`Invalid route number: \`${routeNumber}\``);
    let regionID;
    if (region !== undefined) {
      regionID = isNaN(region) ? GameConstants.Region[region.toLowerCase()] : +region;
    }

    const route = regionRoutes.find(routeData => {
      if (routeData.number == routeNumber && (regionID == undefined || routeData.region == regionID))
        return routeData;
    });

    if (!route) return msg.reply(`Route \`${routeNumber}\` not found${regionID != undefined ? ` in ${GameConstants.Region[regionID]}` : ''}..`);

    let pokemon = Object.values(route.pokemon).flat();
    pokemon = pokemon[Math.floor(Math.random() * pokemon.length)];
    pokemon = pokemonList.find(p => p.name == pokemon);
    if (!pokemon) pokemon = pokemonList[0];

    const shiny = !Math.floor(Math.random() * 512);

    const embed = new MessageEmbed()
      .setTitle(`Route #${routeNumber}`)
      .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`);

    //embed.addField('❯ Pokemon', '\u200b');
    Object.entries(route.pokemon).forEach(([type, pokemon]) => {
      if (!pokemon.length) return;
      const desc = [];
      desc.push('```prolog');
      pokemon.forEach(p => desc.push(p));
      desc.push('```');
      embed.addField(`❯ ${type.toUpperCase()}`, desc.join('\n'), true);
    });

    embed.addField('\u200b', '\u200b', false);

    // Shards:
    let shardsInfo;
    Object.entries(RouteShardTypes).forEach(([region, routes]) => {
      if (routes[routeNumber]) shardsInfo = routes[routeNumber];
    });
    if (shardsInfo) {
      const descIcon = [];
      const descType = [];
      const descChance = [];
      descType.push('```prolog');
      descChance.push('```prolog');
      Object.entries(shardsInfo).sort(([,a], [,b]) => b - a).forEach(([type, chance]) => {
        // descIcon.push(pokemonTypeIcons[PokemonType[type]]);
        // descType.push(PokemonType[type].padEnd(10, ' '));
        // descChance.push(`${chance.toFixed(1).padStart(4, ' ')}%`);
        descIcon.push(`${pokemonTypeIcons[PokemonType[type]]} **\`${PokemonType[type].padEnd(10, ' ')} ${chance.toFixed(1).padStart(4, ' ')}%\`**`);
      });
      descType.push('```');
      descChance.push('```');
      //embed.addField('\u200b', descIcon.join('\n'), true);
      embed.addField('❯ SHARDS', descIcon.join('\n'), true);
      //embed.addField('\u200b', descChance.join('\n'), true);
    }

    msg.channel.send({ embed });
  },
};
