const { EmbedBuilder } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { website, serverIcons } = require('../config.js');
const {
  pokemonList,
  LevelType,
  PokemonType,
  EvoTrigger,
  GameConstants,
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

    const embed = new EmbedBuilder()
      .setTitle(`#${pokemon.id >= 0 ? pokemon.id.toString().padStart(3, 0) : '???'} ${pokemon.name.toUpperCase()}`)
      .setDescription(`${pokemonTypeIcons[PokemonType[pokemon.type[0]]]} *\`${PokemonType[pokemon.type[0]]}\`*${pokemon.type[1] >= 0 ? `\n${pokemonTypeIcons[PokemonType[pokemon.type[1]]]} *\`${PokemonType[pokemon.type[1]]}\`*` : ''}`)
      .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter({ text: `Data is up to date as of v${gameVersion}` })
      .addField('<:xAttack:1032155850661429278> Base Attack', `${pokemon.attack}`,true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokeball:974600141594034226> Catch Rate', `${pokemon.catchRatePercent}%`, true)
      .addField('<:RareCandy:1032155819489378325> Level Type', `${LevelType[pokemon.levelType]}`, true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Mystery_egg:1032155916688162836> Egg Steps', `${pokemon.eggSteps}`, true);

    if (pokemon.heldItem) {
      embed.addField('<:Amulet_Coin:662909955241803776> Rare Item Drop', `${pokemon.heldItem.type == 3 ? `${berryType[pokemon.heldItem.id]} Berry` : pokemon.heldItem.id.replace(/_/g, ' ')}`, true);
    }

    if (pokemon.locations && Object.keys(pokemon.locations).length) {
      embed.addField('\u200b', '\u200b'); // Spacing
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
              const name = r.routeName.toLowerCase().startsWith(`${GameConstants.Region[region]} route`) ? r.routeName.replace(new RegExp(`^${GameConstants.Region[region]}\\s*`, 'i'), '') : r.routeName;
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
          evolution.restrictions.forEach(r => {
            // Ignore self or evo caught restrictions
            if (r.__class == 'ObtainedPokemonRequirement' && (r.pokemon == evolution.basePokemon || r.pokemon == evolution.evolvedPokemon)) return;
            // Ignore evo cant already have happened restrictions
            if (r.__class == 'CustomRequirement' && r.hint == 'The evolution can\'t have already happened') return;
            // Ignore reached region restrictions
            if (r.__class == 'MaxRegionRequirement') return;
            description += `\n${r.hint}`;
          });
          if (evolution.trigger == EvoTrigger.STONE) {
            description += `\nUsing a ${GameConstants.StoneType[evolution.stone].replace(/_/g, ' ')} evolution item`;
          }

          descriptions.push(description);
        });
        embed.addField('❯ Evolves From', descriptions.join('\n\n').substring(0, 1000));
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
        const description = [];
        Object.entries(pokemon.locations[PokemonLocationType.Safari]).forEach(([region, zones]) => {
          Object.entries(zones).forEach(([zone, chance]) => {
            description.push(`${GameConstants.Region[region].toUpperCase()} - Zone ${zone}: ${chance}%\n`);
          });
        });
        embed.addField('❯ Safari Zone Chance', description.join('\n'));
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
      // Quest Line
      if (pokemon.locations[PokemonLocationType.QuestLineReward]) {
        const description = pokemon.locations[PokemonLocationType.QuestLineReward].join('\n');
        embed.addField('❯ Quest Line', description);
      }
      // Temp Battle Reward
      if (pokemon.locations[PokemonLocationType.TempBattleReward]) {
        const description = pokemon.locations[PokemonLocationType.TempBattleReward].join('\n');
        embed.addField('❯ Temp Battle', description);
      }
      // Gym Reward
      if (pokemon.locations[PokemonLocationType.GymReward]) {
        const description = pokemon.locations[PokemonLocationType.GymReward].join('\n');
        embed.addField('❯ Defeat Gym', description);
      }
      // Dungeon Clear
      if (pokemon.locations[PokemonLocationType.DungeonReward]) {
        const description = pokemon.locations[PokemonLocationType.DungeonReward].join('\n');
        embed.addField('❯ Dungeon Reward', description);
      }
    } else {
      embed.addField('\u200b', `\`\`\`diff\n- Unknown Method\n${pokemon.id != Math.floor(pokemon.id) ? '- Possible Event Only\n' : ''}\`\`\``);
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    interaction.reply({ embeds: [embed] });
  },
};
