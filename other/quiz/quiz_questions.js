const { MessageEmbed, MessageAttachment } = require('discord.js');
const fs =  require('fs');
const { website, serverIcons } = require('../../config.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
  upperCaseFirstLetter,
  BadgeEnums,
  gymList,
  warn,
} = require('../../helpers.js');
const { isHappyHour, happyHourBonus } = require('./happy_hour.js');
const { getWhosThatPokemonImage, getWhosThatPokemonFinalImage } = require('./quiz_functions.js');

// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;
const getShinyAmount = () => 100 + getAmount();
const shinyChance = 64;
const isShiny = (chance = shinyChance) => !Math.floor(Math.random() * (isHappyHour ? chance : chance / happyHourBonus));
const defaultEndFunction = (title, image, description) => async (m, e) => {
  const embed = new MessageEmbed()
    .setTitle(title)
    .setThumbnail(image)
    .setColor('#e74c3c');
  if (description) embed.setDescription(description);
  m.channel.send({ embed }).catch((...args) => warn('Unable to post quiz answer', ...args));
};
const getPokemonByName = name => pokemonList.find(p => p.name == name);

const pokemonListWithEvolution = pokemonList.filter(p => p.evolutions && p.evolutions.length);
const badgeList = Object.keys(BadgeEnums).filter(b => isNaN(b) && !b.startsWith('Elite'));
const gymsWithBadges = Object.keys(gymList).filter(t => badgeList.includes(BadgeEnums[gymList[t].badgeReward]));

const whosThatPokemon = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonList);
    const answer = new RegExp(`^\\W*${pokemon.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?')}\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();

    const description = ['Name the Pokémon!'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
    
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('Who\'s that Pokémon?')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's ${pokemon.name}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const whosThePokemonEvolution = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonListWithEvolution);
    const answer = new RegExp(`^\\W*(${pokemon.evolutions.map(p => p.evolvedPokemon.replace(/\s?\(.+/, '').replace(/\W/g, '.?')).join('|')})\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();

    const description = ['Who can this Pokémon evolve to?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
    
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('Name the Evolution!')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(getPokemonByName(pokemon.evolutions[0].evolvedPokemon), shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's ${pokemon.evolutions.map(p => p.evolvedPokemon).join(' or ')}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const whosThePokemonPrevolution = () => new Promise(resolve => {
  (async () => {
    const prevolution = randomFromArray(pokemonListWithEvolution);
    const evolution = randomFromArray(prevolution.evolutions);
    const pokemon = pokemonList.find(p => p.name == evolution.evolvedPokemon);
    const answer = new RegExp(`^\\W*(${prevolution.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?')})\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();

    const description = ['Who does this Pokémon evolve from?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
    
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('Name the Prevolution!')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(prevolution, shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's ${prevolution.name}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const pokemonType = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonList);
    const types = pokemon.type.map(t => PokemonType[t]);
    const answer = new RegExp(`^\\W*(${types.join('\\W*')}|${types.reverse().join('\\W*')})\\b`, 'i');

    let amount = getAmount();

    const shiny = isShiny();

    const description = ['What is this Pokémons type(s)?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
    
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('What\'s the type?')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's ${types.join(' & ')}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const pokemonID = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonList);
    const answer = new RegExp(`^\\W*#?${Math.floor(+pokemon.id)}\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();

    const description = ['What is this Pokémons national Pokédex ID?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
  
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('What\'s the ID?')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's #${pokemon.id.toString().padStart(3, '0')}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const pokemonRegion = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonList);
    const answer = new RegExp(`^\\W*${GameConstants.Region[pokemon.nativeRegion]}\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();

    const description = ['What is this Pokémons native region?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, shiny);
  
    fs.writeFile('who.png', base64Image, {encoding: 'base64'}, async function(err) {
      const attachment = await new MessageAttachment().setFile('who.png');

      const embed = new MessageEmbed()
        .setTitle('What\'s the Region?')
        .setDescription(description)
        .setImage('attachment://who.png')
        .setColor('#3498db');
    
      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny);
          fs.writeFile('whoFinal.png', base64ImageFinal, {encoding: 'base64'}, async function(err) {
            const attachmentFinal = await new MessageAttachment().setFile('whoFinal.png');
            const embed = new MessageEmbed()
              .setTitle(`It's ${GameConstants.Region[pokemon.nativeRegion]}!`)
              .setImage('attachment://whoFinal.png')
              .setColor('#e74c3c');
            m.channel.send({ embed, files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
          });
        },
      });
    });
  })();
});

const fossilPokemon = () => {
  const [fossil, pokemon] = randomFromArray(Object.entries(GameConstants.FossilToPokemon));
  const answer = new RegExp(`^\\W*${pokemon.replace(/\s?\(.+/, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  let amount = getAmount();

  const shiny = isShiny();

  const description = ['What Pokémon comes from this fossil?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const image = encodeURI(`${website}assets/images/breeding/${fossil}.png`);

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokémon?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');
  
  const pokemonData = getPokemonByName(pokemon);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}.png`;

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${pokemon}!`, pokemonImage),
  };
};

const pokemonFossil = () => {
  const [fossil, pokemonName] = randomFromArray(Object.entries(GameConstants.FossilToPokemon));
  const answer = new RegExp(`^\\W*${fossil.replace(/\s*fossil/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  
  let amount = getAmount();

  const shiny = isShiny();

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

  const fossilImage = encodeURI(`${website}assets/images/breeding/${fossil}.png`);

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction(`It's the ${fossil}!`, fossilImage),
  };
};

const dockTown = () => {
  const town = randomFromArray(GameConstants.DockTowns);
  const region = GameConstants.DockTowns.findIndex(t => t == town);
  const answer = new RegExp(`^\\W*${town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where abouts is the Dock located in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Setting sail!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/ship.png`)
    .setColor('#3498db');

  const townImage = encodeURI(`${website}assets/images/towns/${town}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${town}!`, townImage),
  };
};

const startingTown = () => {
  const town = randomFromArray(GameConstants.StartingTowns);
  const region = GameConstants.StartingTowns.findIndex(t => t == town);
  const answer = new RegExp(`^\\W*${town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = [`Where does the player start in the ${upperCaseFirstLetter(GameConstants.Region[region])} region?`];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Getting started!')
    .setDescription(description)
    .setThumbnail(`${website}assets/images/ship.png`)
    .setColor('#3498db');

  const townImage = encodeURI(`${website}assets/images/towns/${town}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${town}!`, townImage),
  };
};

const badgeGymLeader = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.leaderName.replace(/\d/g, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Gym Leader awards this badge?'];
  description.push(`||${badge} Badge||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new MessageEmbed()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description)
    .setThumbnail(encodeURI(`${website}assets/images/badges/${badge}.png`))
    .setColor('#3498db');

  const gymLeaderImage = encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${gym.leaderName}!`, gymLeaderImage),
  };
};

const badgeGymLocation = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location has a Gym that awards this badge?'];
  description.push(`||${badge} Badge||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/badges/${badge}.png`);

  const embed = new MessageEmbed()
    .setTitle('Where\'s the Gym?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');

  const townImage = encodeURI(`${website}assets/images/towns/${gym.town}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${gym.town}!`, townImage),
  };
};

const pokemonGymLeader = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const pokemonName = randomFromArray(gym.pokemons).name;
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  const leaders = Object.values(gymList).filter(g => g.pokemons.find(p => p.name == pokemonName)).map(l => l.leaderName);
  const leadersRegex = leaders.map(l => l.replace(/\W/g, '.?')).join('|');
  const answer = new RegExp(`^\\W*(${leadersRegex})\\b`, 'i');
  
  let amount = getAmount();

  const description = ['Which Gym Leader uses this Pokémon?'];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();

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

  const gymLeaderImage = encodeURI(`${website}assets/images/gymLeaders/${leaders[0]}.png`);

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction(`It's ${leaders.join(' or ')}!`, gymLeaderImage),
  };
};

const gymLeaderPokemon = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const pokemon = gym.pokemons.map(p => p.name.replace(/\s?\(.+/, '').replace(/\W/g, '.?'));
  const answer = new RegExp(`^\\W*(${pokemon.join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const description = ['Which Pokémon does this Gym Leader use?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const image = encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`);

  const embed = new MessageEmbed()
    .setTitle('Which Pokemon?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');

  const pokemonData = getPokemonByName(gym.pokemons[0].name);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}.png`;

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction('The Pokémon are:', pokemonImage, [...new Set(gym.pokemons.map(p => p.name))].join('\n')),
  };
};

const gymLeaderLocation = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location can you find this Gym Leader?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`);

  const embed = new MessageEmbed()
    .setTitle('Where are they?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`The location is ${gym.town}!`, image),
  };
};

const gymLeaderBadge = () => {
  const gym = gymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${badge.replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Badge does this Gym Leader award?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`);

  const embed = new MessageEmbed()
    .setTitle('What\'s the Badge?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');

  const badgeImage = encodeURI(`${website}assets/images/badges/${badge}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's the ${badge} Badge!`, badgeImage),
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

  const description = ['Which main Pokémon type does this Gym Leader use?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/gymLeaders/${gym.leaderName}.png`);

  const embed = new MessageEmbed()
    .setTitle('What\'s the Type?')
    .setDescription(description)
    .setThumbnail(image)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`The type is ${mainTypes.join(' or ')}!`, image),
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
  new WeightedOption(pokemonRegion, 4),
  new WeightedOption(whosThePokemonEvolution, 6),
  new WeightedOption(whosThePokemonPrevolution, 6),
  new WeightedOption(pokemonID, 3),
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

const getQuizQuestion = async () => {
  const selected = selectWeightedOption(quizTypes);
  return await selected.option();
};

module.exports = {
  getQuizQuestion,
};
