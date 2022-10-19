const { MessageEmbed } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { website, serverIcons } = require('../config.js');
const {
  upperCaseFirstLetter,
  pokemonList,
  LevelType,
  PokemonType,
  EvolutionType,
  GameConstants,
  WeatherType,
  PokemonLocationType,
  pokemonTypeIcons,
  gameVersion,
  berryType,
  regionRoutes,
} = require('../helpers.js');

const fuzzyPokemon = FuzzySet(pokemonList.map(p => p.name.toLowerCase()), false);

module.exports = {
  name        : 'pokemon',
  aliases     : ['p', 'poke', 'pinfo', 'pokeinfo'],
  description : 'Get PokéClicker game info about a specific Pokémon',
  args        : [
    {
      name: 'name-id',
      type: 'STRING',
      description: 'Name or Pokédex ID of the Pokémon',
      required: true,
    },
    {
      name: 'shiny',
      type: 'BOOLEAN',
      description: 'Shiny image',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const id = interaction.options.get('name-id').value;
    const shiny = interaction.options.get('shiny')?.value || false;

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
      .setDescription(`${pokemonTypeIcons[PokemonType[pokemon.type[0]]]} *\`${PokemonType[pokemon.type[0]]} \`*${pokemon.type[1] >= 0 ? `\n${pokemonTypeIcons[PokemonType[pokemon.type[1]]]} *\`${PokemonType[pokemon.type[1]]}\`*` : ''}`)
      .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter({ text: `Data is up to date as of v${gameVersion}` })
      .addField('<:xAttack:1032155850661429278> Base Attack', `${pokemon.attack}`,true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokeball:733980790718988348> Catch Rate', `${pokemon.catchRatePercent}%`, true)
      .addField('<:RareCandy:1032155819489378325> Level Type', `${LevelType[pokemon.levelType]}`, true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Mystery_egg:1032155916688162836> Egg Steps', `${pokemon.eggSteps}`, true);

    if (pokemon.heldItem) {
      embed.addField('<:Amulet_Coin:662909955241803776> Rare Item Drop', `${pokemon.heldItem.type == 3 ? `${berryType[pokemon.heldItem.id]} Berry` : pokemon.heldItem.id.replace(/_/g, ' ')}`, true);
    }

    if (pokemon.locations && Object.keys(pokemon.locations).length) {
      embed.addField('\u200b', '\u200b'); // Spacing
      // Routes
      if (pokemon.locations[PokemonLocationType.Route]) {
        let description = '';
        Object.entries(pokemon.locations[PokemonLocationType.Route]).forEach(([region, routes]) => {
          description += `\n\n__${GameConstants.Region[region].toUpperCase()}:__\n`;
          /* TO BE FIXED: Too large for Discord for some mons
          routes.forEach(route => {
            description += `\n${route.route}`;
            description += `${route.requirements ? `🔒\n***Unlock Requirements:***\n_${route.requirements.replace(/\band\b/g, '\nand').replace(/\bor\b/g, '\nor')}_` : ''}`;
          });
          */
          description += [
            ...new Set(routes.map(route => {
              const r = regionRoutes.find(routeData => {
                if (routeData.number == route.route && routeData.region == region)
                  return routeData;
              });
              const name = r.routeName.toLowerCase().startsWith(`${GameConstants.Region[region]} route`) ? `Route ${r.number}` : r.routeName;
              return `${name}${route.requirements ? '🔒' : ''}`;
            })),
          ].join('\n');
        });
        if (description.length >= 1024) {
          description = `${description.substring(0, 1010).replace(/\n.+$/, '')}\n... and more`;
        }
        embed.addField('❯ Routes', description);
      }
      // Roaming
      if (pokemon.locations[PokemonLocationType.Roaming]) {
        const description = pokemon.locations[PokemonLocationType.Roaming].map(r => `${GameConstants.Region[r.region].toUpperCase()}${r.requirements ? `🔒\n***Unlock Requirements:***\n_${r.requirements.replace(/\band\b/g, '\nand').replace(/or/g, '\nor')}_` : ''}`).join('\n');
        embed.addField('❯ Roaming', description);
      }
      // Dungeon
      if (pokemon.locations[PokemonLocationType.Dungeon]) {
        const description = pokemon.locations[PokemonLocationType.Dungeon].join('\n');
        embed.addField('❯ Dungeons', description);
      }
      // Dungeon Boss
      if (pokemon.locations[PokemonLocationType.DungeonBoss]) {
        const description = pokemon.locations[PokemonLocationType.DungeonBoss].map(d => `${d.dungeon}${d.requirements ? `🔒\n***Unlock Requirements:***\n_${d.requirements.replace(/\band\b/g, '\nand').replace(/\bor\b/g, '\nor')}_` : ''}`).join('\n');
        embed.addField('❯ Dungeon Boss', description);
      }
      // Dungeon Chest
      if (pokemon.locations[PokemonLocationType.DungeonChest]) {
        const description = pokemon.locations[PokemonLocationType.DungeonChest].map(d => `${d.dungeon}${d.requirements ? `🔒\n***Unlock Requirements:***\n_${d.requirements.replace(/\band\b/g, '\nand').replace(/\bor\b/g, '\nor')}_` : ''}`).join('\n');
        embed.addField('❯ Dungeon Chest', description);
      }
      // Evolutions
      if (pokemon.locations[PokemonLocationType.Evolution]) {
        const descriptions = [];
        pokemon.locations[PokemonLocationType.Evolution].forEach(evolution => {
          let description = `\`${evolution.basePokemon.toUpperCase()}:\``;
          description += evolution.type.includes(EvolutionType.Level) ? `\n<:RareCandy:1032155819489378325> Above level ${evolution.level}` : '';
          description += evolution.type.includes(EvolutionType.Stone) ? `\n<:Moon_stone:1032156549914841108> Using a ${GameConstants.StoneType[evolution.stone].replace(/_/g, ' ')}` : '';
          description += evolution.type.includes(EvolutionType.Timed) ? `\n🕒 Between ${evolution.startHour > 12 ? evolution.startHour - 12 : evolution.startHour || 12}${evolution.startHour && evolution.startHour <= 12 ? 'am' : 'pm'} → ${evolution.endHour > 12 ? evolution.endHour - 12 : evolution.endHour || 12}${evolution.endHour && evolution.endHour <= 12 ? 'am' : 'pm'}` : '';
          description += evolution.type.includes(EvolutionType.Dungeon) ? `\n<:dungeonToken:751765172657586177> While in ${evolution.dungeon}` : '';
          description += evolution.type.includes(EvolutionType.Region) ? `\n⛴️ While in ${evolution.regions.map(r => upperCaseFirstLetter(GameConstants.Region[r])).join(' or ')}` : '';
          description += evolution.type.includes(EvolutionType.Gym) ? `\n<:fighting_icon:774090473966403585> While fighting the ${evolution.town} Gym` : '';
          description += evolution.type.includes(EvolutionType.Environment) ? `\n🌳 While in a ${evolution.environment} environment` : '';
          description += evolution.type.includes(EvolutionType.Weather) ? `\n🌥️ While in ${evolution.weather.map(w => WeatherType[w]).join(' or ')} weather` : '';
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
        embed.addField('❯ Breeding', description);
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
      // Battle Frontier
      if (pokemon.locations[PokemonLocationType.BattleFrontier]) {
        const description = pokemon.locations[PokemonLocationType.BattleFrontier].map(stage => `Stage ${stage}`).join('\n');
        embed.addField('❯ Battle Frontier', description);
      }
      // Wandering
      if (pokemon.locations[PokemonLocationType.Wandering]) {
        const description = pokemon.locations[PokemonLocationType.Wandering].join('\n');
        embed.addField('❯ Farm Wandering', description);
      }
      // Discord
      if (pokemon.locations[PokemonLocationType.Discord]) {
        const description = pokemon.locations[PokemonLocationType.Discord].map(price => `${serverIcons.money} ${price.toLocaleString()}`).join('\n');
        embed.addField('❯ Discord Shop', description);
      }
    } else {
      embed.addField('\u200b', '```diff\n-Currently Unobtainable\n```');
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    interaction.reply({ embeds: [embed] });
  },
};
