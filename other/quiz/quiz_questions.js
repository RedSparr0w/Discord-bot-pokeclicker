const { MessageEmbed } = require('discord.js');
const { website, serverIcons } = require('../../config.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
  upperCaseFirstLetter,
  BadgeEnums,
  gymList,
} = require('../../helpers.js');
const { isHappyHour, happyHourBonus } = require('./happy_hour.js');

// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;
const getShinyAmount = () => 100;
const isShiny = chance => !Math.floor(Math.random() * (isHappyHour ? chance : chance / happyHourBonus));

const pokemonListWithEvolution = pokemonList.filter(p => p.evolutions && p.evolutions.length);
const badgeList = Object.keys(BadgeEnums).filter(b => isNaN(b) && !b.startsWith('Elite'));
const gymsWithBadges = Object.keys(gymList).filter(t => badgeList.includes(BadgeEnums[gymList[t].badgeReward]));

const whosThatPokemon = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^\\W*${pokemon.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Name the Pokémon!'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokémon?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const whosThePokemonEvolution = () => {
  const pokemon = randomFromArray(pokemonListWithEvolution);
  const answer = new RegExp(`^\\W*(${pokemon.evolutions.map(p => p.evolvedPokemon.replace(/\s?\(.+/, '').replace(/\W/g, '.?')).join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Who can this Pokémon evolve to?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Name the Evolution!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const whosThePokemonPrevolution = () => {
  const prevolution = randomFromArray(pokemonListWithEvolution);
  const evolution = randomFromArray(prevolution.evolutions);
  const pokemon = pokemonList.find(p => p.name == evolution.evolvedPokemon);
  const answer = new RegExp(`^\\W*(${prevolution.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?')})\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Who does this Pokémon evolve from?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Name the Prevolution!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const pokemonType = () => {
  const pokemon = randomFromArray(pokemonList);
  const types = pokemon.type.map(t => PokemonType[t]);
  const answer = new RegExp(`^\\W*(${types.join('|') + (types.length > 1 ? `)\\s+?(${types.join('|')}` : '')})\\b`, 'i');

  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokémons type(s)?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('What\'s the type?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const pokemonID = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^\\W*#?${Math.floor(+pokemon.id)}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokémons national Pokedex ID?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('What\'s the ID?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const pokemonRegion = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^\\W*${GameConstants.Region[pokemon.nativeRegion]}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokémons native region?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('What\'s the Region?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const fossilPokemon = () => {
  const [fossil, pokemon] = randomFromArray(Object.entries(GameConstants.FossilToPokemon));
  const answer = new RegExp(`^\\W*${pokemon.replace(/\s?\(.+/, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['What Pokémon comes from this fossil?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokémon?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/breeding/${fossil}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const pokemonFossil = () => {
  const [fossil, pokemonName] = randomFromArray(Object.entries(GameConstants.FossilToPokemon));
  const answer = new RegExp(`^\\W*${fossil.replace(/\s*fossil/i, '')}\\b`, 'i');
  
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What fossil does this Pokémon come from?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('What\'s the fossil?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const dockTown = () => {
  const town = randomFromArray(GameConstants.DockTowns);
  const region = GameConstants.DockTowns.findIndex(t => t == town);
  const answer = new RegExp(`^\\W*${town.replace(/\s*(town|city|island)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where abouts is the Dock located in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Setting sail!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/ship.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const startingTown = () => {
  const town = randomFromArray(GameConstants.StartingTowns);
  const region = GameConstants.StartingTowns.findIndex(t => t == town);
  const answer = new RegExp(`^\\W*${town.replace(/\s*(town|city|island)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where does the player start in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Getting started!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/ship.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const badgeGymLeader = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.leaderName.replace(/\d/g, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Gym Leader awards this badge?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/badges/${badge}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const badgeGymLocation = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location has a Gym that awards this badge?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Where\'s the Gym?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/badges/${badge}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const pokemonGymLeader = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const pokemonName = randomFromArray(gym.pokemons).name;
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  const leaders = Object.values(gymList).filter(g => g.pokemons.find(p => p.name == pokemonName)).map(g => g.leaderName);
  const answer = new RegExp(`^\\W*(${leaders.join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const description = ['Which Gym Leader uses this Pokémon?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny(128);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const gymLeaderPokemon = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const pokemon = gym.pokemons.map(p => p.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?'));
  const answer = new RegExp(`^\\W*(${pokemon.join('|')})\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Pokémon does this Gym Leader use?', `||${gym.leaderName}||`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Which Pokemon?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const gymLeaderLocation = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location can you find this Gym Leader?', `||${gym.leaderName}||`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Where are they?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const gymLeaderBadge = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${badge}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Badge does this Gym Leader award?', `||${gym.leaderName}||`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('What\'s the Badge?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

const gymLeaderType = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const pokemonNames = gym.pokemons.map(p => p.name);
  const pokemon = pokemonList.filter(p => pokemonNames.includes(p.name));
  const types = pokemon.map(p => p.type).flat();
  const typeCount = {};
  types.forEach(t => typeCount[t] = (typeCount[t] || 0) + 1);
  const maxTypeAmount = Math.max(...Object.values(typeCount));
  const mainTypes = Object.entries(typeCount).filter(([t, c]) => c >= maxTypeAmount).map(([t]) => PokemonType[t]);
  const answer = new RegExp(`^\\W*(${mainTypes.join('|')})\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which main Pokémon type does this Gym Leader use?', `||${gym.leaderName}||`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('What\'s the Type?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
  };
};

class WeightedOption {
  constructor(option, weight) {
    this.option = option;
    this.weight = weight;
  }
}

const selectWeightedOption = (options_array) => {
  const total = options_array.reduce((acc, o) => acc + o.weight, 0);
  const rand = Math.random() * total;
  let acc = 0;
  return options_array.find(o => {
    acc += o.weight;
    return acc >= rand;
  });
};

const quizTypes = [
  new WeightedOption(whosThatPokemon, 10),
  new WeightedOption(pokemonType, 8),
  new WeightedOption(pokemonRegion, 6),
  new WeightedOption(whosThePokemonEvolution, 6),
  new WeightedOption(whosThePokemonPrevolution, 6),
  new WeightedOption(pokemonID, 1),
  new WeightedOption(fossilPokemon, 1),
  new WeightedOption(pokemonFossil, 1),
  new WeightedOption(startingTown, 1),
  new WeightedOption(dockTown, 1),
  new WeightedOption(badgeGymLeader, 1),
  new WeightedOption(badgeGymLocation, 1),
  new WeightedOption(pokemonGymLeader, 1),
  new WeightedOption(gymLeaderPokemon, 1),
  new WeightedOption(gymLeaderLocation, 1),
  new WeightedOption(gymLeaderBadge, 1),
  new WeightedOption(gymLeaderType, 1),
  // new WeightedOption(___, 1),
];

const getQuizQuestion = () => selectWeightedOption(quizTypes).option();

module.exports = {
  getQuizQuestion,
};
