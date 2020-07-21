const { MessageEmbed } = require('discord.js');
const { pokemonsPerRoute, pokemonList } = require('../helpers.js');

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

    if (!route) return msg.reply(`Invalid route number: \`${routeNumber}\``);

    let pokemon = Object.values(route).flat();
    pokemon = pokemon[Math.floor(Math.random() * pokemon.length)];
    pokemon = pokemonList.find(p => p.name == pokemon);
    if (!pokemon) pokemon = pokemonList[0];

    const shiny = !Math.floor(Math.random() * 512);

    const embed = new MessageEmbed()
      .setTitle(`Route #${routeNumber}`)
      .setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter('Data is up to date as of v0.4.14');


    Object.entries(route).forEach(([type, pokemon]) => {
      if (!pokemon.length) return;
      const desc = [];
      desc.push('```prolog');
      pokemon.forEach(p => desc.push(p));
      desc.push('```');
      embed.addField(`❯ ${type.toUpperCase()}`, desc.join('\n'));
    });

    msg.channel.send({ embed });
  },
};
