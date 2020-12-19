const { MessageEmbed } = require('discord.js');
const { website } = require('../config.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
  upperCaseFirstLetter,
} = require('../helpers.js');
const money_icon = '<:money:737206931759824918>';

// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;
const getShinyAmount = () => 100;
const isShiny = chance => !Math.floor(Math.random() * chance);

const pokemonListWithEvolution = pokemonList.filter(p => p.evolutions && p.evolutions.length);

const whosThatPokemon = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^${pokemon.name.replace(/\s?\(.+/, '').replace('.', '.?')}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Name the Pokemon!'];
  description.push(`**+${amount} ${money_icon}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokemon?')
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
  const answer = new RegExp(`^(${pokemon.evolutions.map(p => p.evolvedPokemon.replace(/\s?\(.+/, '').replace('.', '.?')).join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Who can this Pokemon evolve to?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^(${prevolution.name.replace(/\s?\(.+/, '').replace('.', '.?')})\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['Who does this Pokemon evolve from?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^(${types.join('|') + (types.length > 1 ? `)\\s+?(${types.join('|')}` : '')})\\b`, 'i');

  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokemons type(s)?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^#?${Math.floor(+pokemon.id)}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokemons national Pokedex ID?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^${GameConstants.Region[pokemon.nativeRegion]}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What is this Pokemons native region?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^${pokemon.replace(/\s?\(.+/, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['What Pokemon comes from this fossil?'];
  description.push(`**+${amount} ${money_icon}**`);

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokemon?')
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
  const answer = new RegExp(`^${fossil.replace(/\s*fossil/i, '')}\\b`, 'i');
  
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  
  let amount = getAmount();

  const shiny = isShiny(128);

  const description = ['What fossil does this Pokemon come from?'];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^${town.replace(/\s*(town|city)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where abouts is the Dock located in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${money_icon}**`);

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
  const answer = new RegExp(`^${town.replace(/\s*(town|city)/i, '')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where does the player start in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${money_icon}**`);

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
];

const getQuizQuestion = () => selectWeightedOption(quizTypes).option();

module.exports = {
  getQuizQuestion,
};
