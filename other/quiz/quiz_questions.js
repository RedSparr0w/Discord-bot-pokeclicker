const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { website, serverIcons } = require('../../config.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  enumStrings,
  GameConstants,
  upperCaseFirstLetter,
  BadgeEnums,
  GymList,
  warn,
  pokemonTypeIcons,
  StoneType,
  berryType,
} = require('../../helpers.js');
const { isHappyHour, happyHourBonus, incrementHappyHourShinyCount } = require('./happy_hour.js');
const { getRandomPokemon, getWhosThatPokemonImage, getWhosThatPokemonFinalImage, isFemale } = require('./quiz_functions.js');

// Between 30 and 60 coins per question
const getAmount = () => Math.floor(Math.random() * 7) * 5 + 30;
const getShinyAmount = () => 100 + getAmount();
const shinyChance = 54;
const isShiny = (chance = shinyChance) => {
  const shiny = !Math.floor(Math.random() * (isHappyHour() ? chance / happyHourBonus : chance));
  if (shiny && isHappyHour()) {
    incrementHappyHourShinyCount();
  }
  return shiny;
};
const defaultEndFunction = (title, image, description) => async (m, e) => {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setThumbnail(image)
    .setColor('#e74c3c');
  if (description) embed.setDescription(typeof description == 'string' ? description : description.join('\n'));
  m.channel.send({ embeds: [embed] }).catch((...args) => warn('Unable to post quiz answer', ...args));
};
const getPokemonByName = name => pokemonList.find(p => p.name == name);
const pokemonNameNormalized = (name) => name.replace(/\s?\(.+\)$/, '').replace(/.*(Magikarp).*/, '$1').replace(/\W/g, '.?').replace(/.*((Segin|Schedar|Segin|Ruchbah|Caph)\.\?Starmobile).*/, '($1)|(Revavroom)').replace(/(Valencian|Pinkan|Pink|Handout|Charity|Blessing|Crystal|Titan)\s*/gi, '($1)?').replace(/Noble\s*/g, '(Noble|Hisuian)?\\s*');
const evolutionsNormalized = (evolution) => evolution.replace(/\W|_/g, '.?').replace(/(Level)\s*/gi, '($1)?');
const pokemonNameAnswer = (name) => new RegExp(`^\\W*${pokemonNameNormalized(name)}\\b`, 'i');
const berryList = Object.keys(berryType).filter(b => isNaN(b) && b != 'None');

const regionListWithoutFinalAndNone = enumStrings(GameConstants.Region).filter(t => t != 'final' && t != 'none');
const pokemonListWithEvolution = pokemonList.filter(p => p.evolutions && p.evolutions.length);
const badgeList = Object.keys(BadgeEnums).filter(b => isNaN(b) && !b.startsWith('Elite'));
const gymsWithBadges = Object.keys(GymList).filter(t => badgeList.includes(BadgeEnums[GymList[t].badgeReward]));
const allGyms = Object.keys(GymList);
const allGymTypes = {};
Object.keys(GymList).forEach(gym => {
  const pokemonNames = GymList[gym].pokemons.map(p => p.name);
  const pokemon = pokemonList.filter(p => pokemonNames.includes(p.name));
  const types = pokemon.map(p => p.type).flat();
  const typeCount = {};
  types.forEach(t => typeCount[t] = (typeCount[t] || 0) + 1);
  const maxTypeAmount = Math.max(...Object.values(typeCount));
  const mainTypes = Object.entries(typeCount).filter(([t, c]) => c >= maxTypeAmount).map(([t]) => PokemonType[t]);
  allGymTypes[gym] = mainTypes;
});

const whosThatPokemon = () => new Promise(resolve => {
  (async () => {
    const pokemon = getRandomPokemon();
    const answer = pokemonNameAnswer(pokemon.name);
    
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['Name the Pokémon!'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('Who\'s that Pokémon?')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle(`It's ${pokemon.name}!`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const whatIsThatBerry = () => new Promise(resolve => {
  (async () => {

    const berry = randomFromArray(berryList);
    const answer = new RegExp(`^\\W*#?${berry}.?(Berry)?\\b`, 'i');

    const amount = getAmount();

    const description = ['What is the name of this Berry?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    const imageUrl = encodeURI(`${website}assets/images/items/berry/${berry}.png`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create the attachment
    const attachment = new AttachmentBuilder(buffer, { name: 'berry.png' });

    const embed = new EmbedBuilder()
      .setTitle('Name the Berry!')
      .setDescription(description.join('\n'))
      .setThumbnail('attachment://berry.png')
      .setColor('#0690fe');
  
    resolve({
      embed,
      answer,
      amount,
      files: [attachment],
      end: async (m, e) => {
        const embed = new EmbedBuilder()
          .setTitle(`It's ${berry} Berry!`)
          .setThumbnail('attachment://berry.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachment] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});



const howDoesThisPokemonEvolve = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonListWithEvolution.filter(p => p.evolutions.some(e => e.trigger === 1 || e.trigger === 2)));
    const allEligableEvolutions = pokemon.evolutions.filter(e => e.trigger === 1 || e.trigger === 2);
    const allEvolvedNames = [... new Set(allEligableEvolutions.map(e => e.evolvedPokemon))];
    const levelEvolution = [
      ... new Set(allEligableEvolutions
        .flatMap(evolution => evolution.restrictions)
        .filter(restriction => restriction.__class === 'PokemonLevelRequirement')
        .map(restriction => `Level ${restriction.requiredValue}`)),
    ];

    const itemEvolution = [
      ... new Set(allEligableEvolutions
        .map(e => StoneType[e.stone])
        .filter(e => e != undefined)),
    ];

    const allAnswers = [...levelEvolution, ...itemEvolution].map(e => e.replace(/_([a-z])/g, (_, p1) => ` ${p1.toUpperCase()}`));
    const answer = new RegExp(`^\\W*#?${(allAnswers.map(e => evolutionsNormalized(e)).join('|'))}\\b`, 'i');
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);


    const title = `${levelEvolution.length > 0 ? 'Level' : ''}` +
                  `${levelEvolution.length > 0 && itemEvolution.length > 0 ? ' or ' : ''}` +
                  `${itemEvolution.length > 0 ? 'Item' : ''}`;
    const description = [`What ${title} is needed to evolve this Pokémon?`];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const incorrectReaction = (m) => {
      const levelRegEx = /^(Level\s*)?(\d+).*/i;
      const match = m.match(levelRegEx);
      const guessedLvl = match ? match[2] : 'no match';
      if (isNaN(guessedLvl) || levelEvolution.length == 0) {
        return undefined;
      }
      if (levelEvolution.some(e => parseFloat(e.match(levelRegEx)[2]) > guessedLvl)) {
        return '⬆️';
      }

      if (levelEvolution.some(e => parseFloat(e.match(levelRegEx)[2]) < guessedLvl)) {
        return '⬇️';
      }
    };

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('How does this Pokémon evolve?')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      incorrectReaction,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(getPokemonByName(randomFromArray(allEvolvedNames)), shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle('The methods are:')
          .setDescription(`${allAnswers.splice(0, 10).join('\n')}${allAnswers.length ? '\nand more..' : ''}`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const whosThePokemonEvolution = () => new Promise(resolve => {
  (async () => {
    const pokemon = randomFromArray(pokemonListWithEvolution);
    const evolutions = [... new Set(pokemon.evolutions.map(p => p.evolvedPokemon))];
    const answer = new RegExp(`^\\W*(${evolutions.map(p => pokemonNameNormalized(p)).join('|')})\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['Who can this Pokémon evolve to?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('Name the Evolution!')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(getPokemonByName(randomFromArray(evolutions)), shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle('The evolutions are')
          .setDescription(`${evolutions.splice(0, 10).join('\n')}${evolutions.length ? '\nand more..' : ''}`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const whosThePokemonPrevolution = () => new Promise(resolve => {
  (async () => {
    const prevolution = randomFromArray(pokemonListWithEvolution);
    const evolution = randomFromArray(prevolution.evolutions);
    const pokemon = pokemonList.find(p => p.name == evolution.evolvedPokemon);
    const answer = pokemonNameAnswer(prevolution.name);
    
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['Who does this Pokémon evolve from?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('Name the Prevolution!')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(prevolution, shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle(`It's ${prevolution.name}!`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const pokemonType = () => new Promise(resolve => {
  (async () => {
    const pokemon = getRandomPokemon();
    const types = pokemon.type.map(t => PokemonType[t]);
    let memeAnswer = '';
    if (types.includes('Flying') && types.includes('Normal')) {
      memeAnswer = 'bir[bd]';
    }
    const answer = new RegExp(`^\\W*(${types.join('\\W*')}|${types.reverse().join('\\W*')}${memeAnswer && `|${memeAnswer}`})\\b`, 'i');

    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['What is this Pokémons type(s)?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('What\'s the type?')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle(`It's ${types.join(' & ')}!`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const pokemonID = () => new Promise(resolve => {
  (async () => {
    const pokemon = getRandomPokemon();
    const answer = new RegExp(`^\\W*#?${Math.trunc(+pokemon.id)}\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['What is this Pokémons national Pokédex ID?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const incorrectReaction = (m) => {
      const guessedID = parseFloat(m);
      if (Number.isNaN(guessedID)) {
        return undefined;
      }

      if (guessedID < pokemon.id) {
        return '⬆️';
      }

      if (guessedID > pokemon.id) {
        return '⬇️';
      }
    };
  
    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('What\'s the ID?')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      incorrectReaction,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle(`It's ${pokemon.id < 0 ? '-': ''}#${Math.floor(Math.abs(pokemon.id)).toString().padStart(3, '0')}!`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const pokemonRegion = () => new Promise(resolve => {
  (async () => {
    const pokemon = getRandomPokemon();
    const answer = new RegExp(`^\\W*${GameConstants.Region[pokemon.nativeRegion]}\\b`, 'i');
    
    let amount = getAmount();

    const shiny = isShiny();
    const female = isFemale(pokemon);

    const description = ['What is this Pokémons native region?'];
    description.push(`**+${amount} ${serverIcons.money}**`);

    // If shiny award more coins
    if (shiny) {
      const shiny_amount = getShinyAmount();
      description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
      amount += shiny_amount;
    }

    const base64Image = await getWhosThatPokemonImage(pokemon, female);
    const attachment = new AttachmentBuilder(base64Image, { name: 'who.png' });

    const embed = new EmbedBuilder()
      .setTitle('What\'s the Region?')
      .setDescription(description.join('\n'))
      .setImage('attachment://who.png')
      .setColor('#3498db');
  
    resolve({
      embed,
      answer,
      amount,
      shiny,
      files: [attachment],
      end: async (m, e) => {
        const base64ImageFinal = await getWhosThatPokemonFinalImage(pokemon, shiny, female);
        const attachmentFinal = new AttachmentBuilder(base64ImageFinal, { name: 'whoFinal.png' });
        const embed = new EmbedBuilder()
          .setTitle(`It's ${upperCaseFirstLetter(GameConstants.Region[pokemon.nativeRegion])}!`)
          .setImage('attachment://whoFinal.png')
          .setColor('#e74c3c');
        m.channel.send({ embeds: [embed], files: [attachmentFinal] }).catch((...args) => warn('Unable to post quiz answer', ...args));
      },
    });
  })();
});

const fossilPokemon = () => {
  const [fossil, pokemon] = randomFromArray(Object.entries(GameConstants.FossilToPokemon));
  const answer = pokemonNameAnswer(pokemon);
  
  let amount = getAmount();

  const shiny = isShiny();

  const description = ['What Pokémon comes from this fossil?'];
  description.push(`||${fossil}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const image = encodeURI(`${website}assets/images/breeding/${fossil}.png`);

  const embed = new EmbedBuilder()
    .setTitle('Who\'s that Pokémon?')
    .setDescription(description.join('\n'))
    .setThumbnail(image)
    .setColor('#3498db');
  
  const pokemonData = getPokemonByName(pokemon);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}.png`;

  return {
    embed,
    answer,
    amount,
    shiny,
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
  description.push(`||${pokemonName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new EmbedBuilder()
    .setTitle('What\'s the fossil?')
    .setDescription(description.join('\n'))
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

  const embed = new EmbedBuilder()
    .setTitle('Setting sail!')
    .setDescription(description.join('\n'))
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

  const embed = new EmbedBuilder()
    .setTitle('Getting started!')
    .setDescription(description.join('\n'))
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
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.leaderName.replace(/\d/g, '').replace(/\W/g, '.?').replace(/(Cipher\.\?Admin)/gi, '($1)?')}\\b`, 'i');

  const amount = getAmount();

  const description = ['Which Gym Leader awards this badge?'];
  description.push(`***${badge} Badge***`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new EmbedBuilder()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description.join('\n'))
    .setThumbnail(encodeURI(`${website}assets/images/badges/${badge}.svg`))
    .setColor('#3498db');

  const gymLeaderImage = encodeURI(`${website}assets/images/npcs/${gym.optionalArgs.imageName?? gym.leaderName}.png`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's ${gym.leaderName}!`, gymLeaderImage),
  };
};

const badgeGymLocation = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location has a Gym that awards this badge?'];
  description.push(`***${badge} Badge***`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/badges/${badge}.svg`);

  const embed = new EmbedBuilder()
    .setTitle('Where\'s the Gym?')
    .setDescription(description.join('\n'))
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
  const gym = GymList[randomFromArray(allGyms)];
  const pokemonName = randomFromArray(gym.pokemons).name;
  const pokemon = pokemonList.find(p => p.name == pokemonName);
  const gyms = allGyms.filter(g => GymList[g].pokemons.find(p => p.name == pokemonName));
  const leaders = gyms.map(g => GymList[g].leaderName);
  const leadersRegex = leaders.map(l => l.replace(/\d/g, '.?').replace(/\W/g, '.?').replace(/(Cipher\.\?Admin)/gi, '($1)?')).join('|');
  const answer = new RegExp(`^\\W*(${leadersRegex})\\b`, 'i');
  
  let amount = getAmount();

  const description = ['Which Gym Leader uses this Pokémon?'];
  description.push(`||${pokemonName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();
  const female = isFemale(pokemon);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new EmbedBuilder()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description.join('\n'))
    .setThumbnail(`${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}${female ? '-f' : ''}.png`)
    .setColor('#3498db');

  const gymLeaderToShow = GymList[randomFromArray(gyms)];
  const gymLeaderImage = encodeURI(`${website}assets/images/npcs/${gymLeaderToShow.optionalArgs.imageName?? gymLeaderToShow.leaderName}.png`);

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction(`It's ${leaders.join(' or ')}!`, gymLeaderImage),
  };
};

const gymLeaderPokemon = () => {
  const gym = GymList[randomFromArray(allGyms)];
  const pokemon = gym.pokemons.map(p => pokemonNameNormalized(p.name));
  const answer = new RegExp(`^\\W*(${pokemon.join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const description = ['Which Pokémon does this Gym Leader use?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();


  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const image = encodeURI(`${website}assets/images/npcs/${gym.optionalArgs.imageName?? gym.leaderName}.png`);

  const embed = new EmbedBuilder()
    .setTitle('Which Pokemon?')
    .setDescription(description.join('\n'))
    .setThumbnail(image)
    .setColor('#3498db');

  const pokemonData = getPokemonByName(randomFromArray(gym.pokemons).name);
  const female = isFemale(pokemonData);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}${female ? '-f' : ''}.png`;

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction('The Pokémon are:', pokemonImage, [...new Set(gym.pokemons.map(p => p.name))].join('\n')),
  };
};

const gymLeaderLocation = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const answer = new RegExp(`^\\W*${gym.town.replace(/\s*(town|city|island)/i, '').replace(/\W/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which location can you find this Gym Leader?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/npcs/${gym.optionalArgs.imageName?? gym.leaderName}.png`);

  const embed = new EmbedBuilder()
    .setTitle('Where are they?')
    .setDescription(description.join('\n'))
    .setThumbnail(image)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`The location is ${gym.town}!`, image),
  };
};

const regionRegex = new RegExp(`^(${Object.keys(GameConstants.Region).filter(v => isNaN(+v)).join('|')})_`, 'i');
const gymLeaderBadge = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = new RegExp(`^\\W*${badge.replace(regionRegex, '').replace(/\W|_/g, '.?')}\\b`, 'i');
  
  const amount = getAmount();
  const description = ['Which Badge does this Gym Leader award?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/npcs/${gym.optionalArgs.imageName?? gym.leaderName}.png`);

  const embed = new EmbedBuilder()
    .setTitle('What\'s the Badge?')
    .setDescription(description.join('\n'))
    .setThumbnail(image)
    .setColor('#3498db');

  const badgeImage = encodeURI(`${website}assets/images/badges/${badge}.svg`);

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`It's the ${badge} Badge!`, badgeImage),
  };
};

const typeGymLeader = () => {
  const type = randomFromArray(enumStrings(PokemonType).filter(t => t != 'None'));
  const gyms = allGyms.filter(g => allGymTypes[g].includes(type));
  const leaders = gyms.map(g => GymList[g].leaderName);
  const leadersRegex = leaders.map(l => l.replace(/\W/g, '.?').replace(/(Cipher\.\?Admin)/gi, '($1)?')).join('|');
  const answer = new RegExp(`^\\W*(${leadersRegex})\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which Gym Leader uses this main Pokémon type?'];
  description.push(`${pokemonTypeIcons[type]} ${type}`);
  description.push(`**+${amount} ${serverIcons.money}**`);


  const gymLeaderToShow = GymList[randomFromArray(gyms)];
  const image = encodeURI(`${website}assets/images/npcs/${gymLeaderToShow.optionalArgs.imageName?? gymLeaderToShow.leaderName}.png`);

  const embed = new EmbedBuilder()
    .setTitle('Who\'s the Gym Leader?')
    .setDescription(description.join('\n'))
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction('The leaders are', image, `${leaders.splice(0, 10).join('\n')}${leaders.length ? '\nand more..' : '!'}`),
  };
};

const gymLeaderType = () => {
  const gymTown = randomFromArray(allGyms);
  const gym = GymList[gymTown];
  const mainTypes = allGymTypes[gymTown];
  const answer = new RegExp(`^\\W*(${mainTypes.join('|')})\\b`, 'i');
  
  const amount = getAmount();

  const description = ['Which main Pokémon type does this Gym Leader use?'];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const image = encodeURI(`${website}assets/images/npcs/${gym.optionalArgs.imageName?? gym.leaderName}.png`);

  const embed = new EmbedBuilder()
    .setTitle('What\'s the Type?')
    .setDescription(description.join('\n'))
    .setThumbnail(image)
    .setColor('#3498db');

  return {
    embed,
    answer,
    amount,
    end: defaultEndFunction(`The type is ${mainTypes.join(' or ')}!`, image),
  };
};

const typeRegionPokemon = () => {
  const randomRegionIndex = Math.floor(Math.random() * regionListWithoutFinalAndNone.length);
  const selectedRegion = regionListWithoutFinalAndNone[randomRegionIndex].replace(/^[a-z]/, match => match.toUpperCase());
  const pokemonInRegion = pokemonList.filter(pokemon => pokemon.nativeRegion === randomRegionIndex);
  const randomTypeIndex = randomFromArray(randomFromArray(pokemonInRegion).type);
  const selectedType = enumStrings(PokemonType).filter(type => type !== 'None')[randomTypeIndex];
  const eligiblePokemon = pokemonList.filter(pokemon =>
    pokemon.type.includes(randomTypeIndex) &&
    pokemon.nativeRegion === randomRegionIndex &&
    (!pokemon.name.includes('Arceus') || pokemon.name == 'Arceus (Normal)') &&
    (!pokemon.name.includes('Silvally') || pokemon.name == 'Silvally (Normal)')
  );
  const answer = new RegExp(`^\\W*(${eligiblePokemon.map(p => pokemonNameNormalized(p.name)).join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const description = [`Name a ${pokemonTypeIcons[selectedType]} ${selectedType} Type Pokémon from ${selectedRegion}`];
  description.push(`**+${amount} ${serverIcons.money}**`);
  const shiny = isShiny();


  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ *(shiny)*`);
    amount += shiny_amount;
  }

  const pokemonData = randomFromArray(eligiblePokemon);
  const female = isFemale(pokemonData);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}${female ? '-f' : ''}.png`;

  const eligibleNames = eligiblePokemon.map(p => p.name);

  const embed = new EmbedBuilder()
    .setTitle('Name a Pokémon!')
    .setDescription(description.join('\n'))
    .setColor('#7b21a9');

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction('The Pokémon are', pokemonImage, `${eligibleNames.splice(0, 10).join('\n')}${eligibleNames.length ? '\nand more..' : '!'}`),
  };
};


const dualTypePokemon = () => {
  const selectedPokemon = randomFromArray(pokemonList.filter(p => p.type.length > 1));
  
  const types = selectedPokemon.type.map(t => enumStrings(PokemonType).filter(type => type !== 'None')[t]);
  const eligiblePokemon = pokemonList.filter(pokemon =>
    pokemon.type.every(t => selectedPokemon.type.includes(t)) && pokemon.type.length == selectedPokemon.type.length);

  const answer = new RegExp(`^\\W*(${eligiblePokemon.map(p => pokemonNameNormalized(p.name)).join('|')})\\b`, 'i');
  
  let amount = getAmount();

  const description = [`Name a Pokémon that is both ${pokemonTypeIcons[types[0]]} ${types[0]} Type & ${pokemonTypeIcons[types[1]]} ${types[1]} Type`];
  description.push(`**+${amount} ${serverIcons.money}**`);
  const shiny = isShiny();


  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ *(shiny)*`);
    amount += shiny_amount;
  }

  const pokemonData = randomFromArray(eligiblePokemon);
  const female = isFemale(pokemonData);
  const pokemonImage = `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemonData.id}${female ? '-f' : ''}.png`;

  const eligibleNames = eligiblePokemon.map(p => p.name);

  const embed = new EmbedBuilder()
    .setTitle('Name a Dual Type Pokémon!')
    .setDescription(description.join('\n'))
    .setColor('#b8791d');

  return {
    embed,
    answer,
    amount,
    shiny,
    end: defaultEndFunction('The Pokémon are', pokemonImage, `${eligibleNames.splice(0, 10).join('\n')}${eligibleNames.length ? '\nand more..' : '!'}`),
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
  new WeightedOption(whosThatPokemon, 150),
  new WeightedOption(pokemonType, 85),
  new WeightedOption(howDoesThisPokemonEvolve, 80),
  new WeightedOption(whosThePokemonEvolution, 80),
  new WeightedOption(whosThePokemonPrevolution, 80),
  new WeightedOption(pokemonRegion, 45),
  new WeightedOption(typeRegionPokemon, 45),
  new WeightedOption(dualTypePokemon, 60),
  new WeightedOption(pokemonID, 60),
  new WeightedOption(fossilPokemon, 5),
  new WeightedOption(pokemonFossil, 5),
  new WeightedOption(startingTown, 10),
  new WeightedOption(dockTown, 10),
  new WeightedOption(whatIsThatBerry, 15),
  new WeightedOption(badgeGymLeader, 10),
  new WeightedOption(badgeGymLocation, 5),
  new WeightedOption(pokemonGymLeader, 45),
  new WeightedOption(typeGymLeader, 30),
  new WeightedOption(gymLeaderType, 35),
  new WeightedOption(gymLeaderPokemon, 40),
  new WeightedOption(gymLeaderLocation, 10),
  new WeightedOption(gymLeaderBadge, 10),
  // new WeightedOption(___, 1),
];

const getQuizQuestion = async () => {
  const selected = selectWeightedOption(quizTypes);
  return await selected.option();
};

module.exports = {
  getQuizQuestion,
};
