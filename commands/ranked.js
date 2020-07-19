const { MessageEmbed } = require('discord.js');
const {
  GameConstants,
  pokemonList,
} = require('../helpers.js');

module.exports = {
  name        : 'ranked',
  aliases     : ['ranks', 'rank', 'r'],
  description : 'Get a list of the top ranked Pokémon',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const shiny = !Math.floor(Math.random() * 512);
    const embed = new MessageEmbed()
      .setTitle('Top ranked Pokémon')
      //.setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/130.png`)
      .setColor('#3498db')
      .setFooter('Data is up to date as of v0.4.12');

    const pokemon = pokemonList.map(p=>({ id: p.id, name: p.name, attack: p.attack, apc: (p.attack / p.eggCycles).toFixed(1)}));

    const kantoPokemon = pokemon.filter(p => p.id >= 1 && p.id <= GameConstants.TotalPokemonsPerRegion[GameConstants.Region.kanto]);
    const johtoPokemon = pokemon.filter(p => p.id > GameConstants.TotalPokemonsPerRegion[GameConstants.Region.kanto] && p.id <= GameConstants.TotalPokemonsPerRegion[GameConstants.Region.johto]);
    const hoennPokemon = pokemon.filter(p => p.id > GameConstants.TotalPokemonsPerRegion[GameConstants.Region.johto] && p.id <= GameConstants.TotalPokemonsPerRegion[GameConstants.Region.hoenn]);
    const getTop = (arr, type, amt = 10) => arr.sort((a, b) => b[type] - a[type]).slice(0, amt);

    embed.addField('\u200b', '**============= OVERALL =============**');
    embed.addField('\n❯ Attack', ['```prolog', ...getTop(pokemon, 'attack', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.attack.toString().padStart(3, ' ')}`), '```'].join('\n'), true);
    embed.addField('\n❯ Breeding Attack', ['```prolog', ...getTop(pokemon, 'apc', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.apc.toFixed(1).padStart(4, ' ')}`), '```'].join('\n'), true);
    embed.addField('\u200b', '\u200b', true);

    embed.addField('\u200b', '**============= KANTO =============**');
    embed.addField('\n❯ Attack', ['```prolog', ...getTop(kantoPokemon, 'attack', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.attack.toString().padStart(3, ' ')}`), '```'].join('\n'), true);
    embed.addField('\n❯ Breeding Attack', ['```prolog', ...getTop(kantoPokemon, 'apc', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.apc.toFixed(1).padStart(4, ' ')}`), '```'].join('\n'), true);
    embed.addField('\u200b', '\u200b', true);

    embed.addField('\u200b', '**============= JOHTO =============**');
    embed.addField('\n❯ Attack', ['```prolog', ...getTop(johtoPokemon, 'attack', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.attack.toString().padStart(3, ' ')}`), '```'].join('\n'), true);
    embed.addField('\n❯ Breeding Attack', ['```prolog', ...getTop(johtoPokemon, 'apc', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.apc.toFixed(1).padStart(4, ' ')}`), '```'].join('\n'), true);
    embed.addField('\u200b', '\u200b', true);

    embed.addField('\u200b', '**============= HOENN =============**');
    embed.addField('\n❯ Attack', ['```prolog', ...getTop(hoennPokemon, 'attack', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.attack.toString().padStart(3, ' ')}`), '```'].join('\n'), true);
    embed.addField('\n❯ Breeding Attack', ['```prolog', ...getTop(hoennPokemon, 'apc', 10).map(p => `${p.name.padEnd(13, ' ')} ${p.apc.toFixed(1).padStart(4, ' ')}`), '```'].join('\n'), true);
    embed.addField('\u200b', '\u200b', true);

    msg.channel.send({ embed });
  },
};