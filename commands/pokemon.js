const { MessageEmbed } = require('discord.js');
const FuzzySet = require('fuzzyset');
const {
  pokemonList,
  LevelType,
  PokemonType,
  GameConstants,
  PokemonLocationType,
  pokemonTypeIcons,
  gameVersion,
} = require('../helpers.js');

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
      const fuzzy = FuzzySet(pokemonList.map(p => p.name.toLowerCase()));

      const newNames = fuzzy.get(id);
      if (newNames) {
        pokemon = pokemonList.find(p => p.name.toLowerCase() == newNames[0][1]);
      }
    }
    if (!pokemon) pokemon = pokemonList.find(p => p.id == 0);
    if (!pokemon) return;

    const embed = new MessageEmbed()
      .setTitle(`#${pokemon.id >= 0 ? pokemon.id.toString().padStart(3, 0) : '???'} ${pokemon.name.toUpperCase()}\n${pokemonTypeIcons[PokemonType[pokemon.type[0]]]}${pokemon.type[1] ? ` ${pokemonTypeIcons[PokemonType[pokemon.type[1]]]}` : ''}`)
      .setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`)
      .addField('<:xAttackSmall:733974450864652380> Attack', `${pokemon.attack}`,true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokeball:733980790718988348> Catch Rate', `${pokemon.catchRatePercent}%`, true)
      .addField('<:RareCandySmall:733974449774133299> Level Type', `${LevelType[pokemon.levelType]}`, true)
      .addField('\u200b', '\u200b', true) // Spacing
      .addField('<:Pokemon_egg:733973219177922591> Egg Steps', `${pokemon.eggSteps}`, true)
      .addField('\u200b', '\u200b'); // Spacing

    if (pokemon.locations) {
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
      // Egg
      if (pokemon.locations[PokemonLocationType.LevelEvolution] || pokemon.locations[PokemonLocationType.StoneEvolution]) {
        let description = '';
        let e = pokemon.locations[PokemonLocationType.LevelEvolution];
        description += e ? `${e.basePokemon} @ level ${e.level}` : '';
        e = pokemon.locations[PokemonLocationType.StoneEvolution];
        description += e ? `${e.basePokemon} with ${GameConstants.StoneType[e.stone].replace(/_/g, ' ')}` : '';
        embed.addField('❯ Evolves From', description);
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
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    msg.channel.send({ embed });
  },
};
