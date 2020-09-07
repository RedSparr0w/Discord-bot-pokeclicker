const { MessageEmbed } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { website } = require('../config.json');
const {
  pokemonList,
  LevelType,
  PokemonType,
  EvolutionType,
  GameConstants,
  PokemonLocationType,
  pokemonTypeIcons,
  gameVersion,
} = require('../helpers.js');

const fuzzyPokemon = FuzzySet(pokemonList.map(p => p.name.toLowerCase()), false);

module.exports = {
  name        : 'pokemon',
  aliases     : ['p', 'poke', 'pinfo', 'pokeinfo'],
  description : 'Get PokéClicker game info about a specific Pokémon',
  args        : ['id/name', 'shiny?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let id = args.join(' ').toLowerCase().trim();
    let shiny = false;
    if (id.endsWith(' shiny')) {
      id = id.slice(0, id.length - 6);
      shiny = true;
    }

    let pokemon = pokemonList.find(p => p.id == +id || p.name.toLowerCase() == id);
    if (!pokemon && isNaN(id)) {
      const newNames = fuzzyPokemon.get(id);
      if (newNames) {
        pokemon = pokemonList.find(p => p.name.toLowerCase() == newNames[0][1]);

        // If this pokemon is an alternate form,
        // but the user input didn't include a space,
        // they probably just want the basic form
        if (!Number.isInteger(pokemon.id) && !id.includes(' ')) {
          const firstFormID = Math.floor(pokemon.id);
          pokemon = pokemonList.find(p => p.id == firstFormID) || pokemon;
        }
      }
    }
    if (!pokemon) pokemon = pokemonList.find(p => p.id == 0);
    if (!pokemon) return;

    const embed = new MessageEmbed()
      .setTitle(`#${pokemon.id >= 0 ? pokemon.id.toString().padStart(3, 0) : '???'} ${pokemon.name.toUpperCase()}`)
      .setDescription(`${pokemonTypeIcons[PokemonType[pokemon.type[0]]]} _\`${PokemonType[pokemon.type[0]]}\`_${pokemon.type[1] ? `\n${pokemonTypeIcons[PokemonType[pokemon.type[1]]]} _\`${PokemonType[pokemon.type[1]]}\`_` : ''}`)
      .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`)
      .addField('<:xAttackSmall:733974450864652380> Base Attack', `${pokemon.attack}`,true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokeball:733980790718988348> Catch Rate', `${pokemon.catchRatePercent}%`, true)
      .addField('<:RareCandySmall:733974449774133299> Level Type', `${LevelType[pokemon.levelType]}`, true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokemon_egg:733973219177922591> Egg Steps', `${pokemon.eggSteps}`, true);

    if (pokemon.locations && Object.keys(pokemon.locations).length) {
      embed.addField('\u200b', '\u200b'); // Spacing
      // Routes
      if (pokemon.locations[PokemonLocationType.Route]) {
        let description = '';
        Object.entries(pokemon.locations[PokemonLocationType.Route]).forEach(([region, routes]) => {
          description += `\n\n__${GameConstants.Region[region].toUpperCase()}:__`;
          description += `\n${routes.join(', ')}`;
        });
        embed.addField('❯ Routes', description);
      }
      // Roaming
      if (pokemon.locations[PokemonLocationType.Roaming]) {
        const description = pokemon.locations[PokemonLocationType.Roaming].map(region => GameConstants.Region[region].toUpperCase()).join('\n');
        embed.addField('❯ Roaming', description);
      }
      // Dungeon
      if (pokemon.locations[PokemonLocationType.Dungeon]) {
        const description = pokemon.locations[PokemonLocationType.Dungeon].join('\n');
        embed.addField('❯ Dungeons', description);
      }
      // Dungeon Boss
      if (pokemon.locations[PokemonLocationType.DungeonBoss]) {
        const description = pokemon.locations[PokemonLocationType.DungeonBoss].join('\n');
        embed.addField('❯ Dungeon Boss', description);
      }
      // Evolutions
      if (pokemon.locations[PokemonLocationType.Evolution]) {
        const descriptions = [];
        pokemon.locations[PokemonLocationType.Evolution].forEach(evolution => {
          let description = `\`${evolution.basePokemon.toUpperCase()}:\``;
          description += evolution.type.includes(EvolutionType.Level) ? `\n<:RareCandy:733974449774133299> Above level ${evolution.level}` : '';
          description += evolution.type.includes(EvolutionType.Stone) ? `\n<:Moon_stone:740790300100001863> Using a ${GameConstants.StoneType[evolution.stone].replace(/_/g, ' ')}` : '';
          description += evolution.type.includes(EvolutionType.Timed) ? `\n🕒 Between ${evolution.startHour > 12 ? evolution.startHour - 12 : evolution.startHour || 12}${evolution.startHour && evolution.startHour <= 12 ? 'am' : 'pm'} → ${evolution.endHour > 12 ? evolution.endHour - 12 : evolution.endHour || 12}${evolution.endHour && evolution.endHour <= 12 ? 'am' : 'pm'}` : '';
          description += evolution.type.includes(EvolutionType.Location) ? `\n<:dungeonToken:737206932128923699> While in ${evolution.dungeon}` : '';
          description += evolution.type.includes(EvolutionType.Other) ? '\n🍍 With unknown requirement' : '';

          descriptions.push(description);
        });
        embed.addField('❯ Evolves From', descriptions.join('\n\n'));
      }
      // Egg
      if (pokemon.locations[PokemonLocationType.Egg]) {
        const description = pokemon.locations[PokemonLocationType.Egg].join('\n');
        embed.addField('❯ Egg Types', description);
      }
      // Baby
      if (pokemon.locations[PokemonLocationType.Baby]) {
        const description = pokemon.locations[PokemonLocationType.Baby].join('\n');
        embed.addField('❯ Parents', description);
      }
      // Fossil
      if (pokemon.locations[PokemonLocationType.Fossil]) {
        const description = pokemon.locations[PokemonLocationType.Fossil].join('\n');
        embed.addField('❯ Fossils', description);
      }
      // Shop
      if (pokemon.locations[PokemonLocationType.Shop]) {
        const description = pokemon.locations[PokemonLocationType.Shop].join('\n');
        embed.addField('❯ Shops', description);
      }
      // Safari Zone
      if (pokemon.locations[PokemonLocationType.Safari]) {
        const description = pokemon.locations[PokemonLocationType.Safari];
        embed.addField('❯ Safari Zone Chance', description);
      }
    } else {
      embed.addField('\u200b', '```diff\n-Currently Unobtainable\n```');
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    msg.channel.send({ embed });
  },
};
