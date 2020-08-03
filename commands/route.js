const { MessageEmbed } = require('discord.js');
const { pokemonsPerRoute, pokemonList, RouteShardTypes, PokemonType, pokemonTypeIcons } = require('../helpers.js');

module.exports = {
  name        : 'route',
  aliases     : ['routes', 'routeinfo'],
  description : 'Get PokéClicker game info about a specific Pokémon',
  args        : ['id'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const [routeNumber] = args;
    if (isNaN(routeNumber)) return msg.reply(`Invalid route number: \`${routeNumber}\``);

    let route;
    Object.values(pokemonsPerRoute).forEach(routes => {
      if (route) return;
      route = Object.entries(routes).find(([r, p]) => r == routeNumber);
      if (route) route = route[1];
    });

    if (!route) return msg.reply(`Route \`${routeNumber}\` not found..`);

    let pokemon = Object.values(route).flat();
    pokemon = pokemon[Math.floor(Math.random() * pokemon.length)];
    pokemon = pokemonList.find(p => p.name == pokemon);
    if (!pokemon) pokemon = pokemonList[0];

    const shiny = !Math.floor(Math.random() * 512);

    const embed = new MessageEmbed()
      .setTitle(`Route #${routeNumber}`)
      .setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${process.env.npm_package_version || '?.?.?'}`);

    //embed.addField('❯ Pokemon', '\u200b');
    Object.entries(route).forEach(([type, pokemon]) => {
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
