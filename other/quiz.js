const { MessageEmbed } = require('discord.js');
const { quizChannelID, website } = require('../config.js');
const { addAmount, addStatistic, addPurchased } = require('../database.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
  SECOND,
  MINUTE,
  HOUR,
  upperCaseFirstLetter,
  warn,
} = require('../helpers.js');

const money_icon = '<:money:737206931759824918>';

// Between 1 and 6 minutes
const getTimeLimit = () => Math.floor(Math.random() * (5 * MINUTE)) + (1 * MINUTE);
const isHappyHour = () => Date.now() % (9 * HOUR) < HOUR;
// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;
const getShinyAmount = () => 100;
const isShiny = chance => !Math.floor(Math.random() * chance);

const pokemonListWithEvolution = pokemonList.filter(p => p.evolutions && p.evolutions.length);

const postHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;
  quiz_channel.setRateLimitPerUser(0, 'Happy Hour!').catch(O_o=>{});
  setTimeout(() => quiz_channel.setRateLimitPerUser(5, 'Happy Hour!').catch(O_o=>{}), HOUR);

  const embed = new MessageEmbed()
    .setTitle('It\'s Happy Hour!')
    .setDescription(['For the next 1 hour, questions will be posted 4x as fast!', '', 'Good Luck!'])
    .setColor('#2ecc71');

  return await quiz_channel.send('<@&788190728027242496>', { embed });
};

const newQuiz = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  // Generate and send a random question
  const quiz = selectWeightedOption(quizTypes).option();

  // Time limit in minutes (2 → 10 minutes)
  let time_limit = getTimeLimit();

  const happyHour = isHappyHour();

  // 3 x more questions
  if (happyHour) {
    time_limit /= 4;
    quiz.embed.setFooter('Happy Hour! (4x faster questions)');
  }

  const bot_message = await quiz_channel.send({ embed: quiz.embed }).catch((...args) => warn('Unable to send quiz question', ...args));

  // If no bot message for whatever reason, try again in 1 minute
  if (!bot_message) return setTimeout(() => newQuiz(guild), MINUTE);

  // Which messages are we trying to catch
  const filter = m => quiz.answer.test(m.content);

  // Reason for footer once finished
  let end_reason = 'Closed';
  let finished = 0;

  const winners = new Set();

  const collector = quiz_channel.createMessageCollector(filter, { time: time_limit });
  collector.on('collect', async m => {
    const user = m.author;

    // If this is the first answer
    if (!finished) {
      finished = m.createdTimestamp;
    } else {
      if (winners.has(user.id) || m.createdTimestamp - finished > 3 * SECOND) {
        return;
      }
      quiz.amount = Math.floor(quiz.amount / 2);
      if (!quiz.amount) {
        return;
      }
    }
    winners.add(user.id);
    const amount = quiz.amount;

    m.react('🎉');

    // Add coins to the users balance
    const balance = await addAmount(user, amount);
    const answered = await addStatistic(user, 'qz_answered');
    addStatistic(user, 'qz_coins_won', amount);

    // If user has answered more than 100 questions, give them the Marsh Badge
    if (answered >= 100) {
      await addPurchased(user, 'badge', 4);
    }

    const description = [
      `${user}`,
      '**CORRECT!**',
      `**+${amount} ${money_icon}**`,
    ];

    const embed = new MessageEmbed()
      .setDescription(description)
      .setFooter(`Balance: ${balance.toLocaleString('en-US')}`)
      .setColor('#2ecc71');

    m.channel.send({ embed }).catch((...args) => warn('Unable to send quiz winner message', ...args));
  });
  // errors: ['time'] treats ending because of the time limit as an error
  quiz_channel.awaitMessages(filter, { max: 1, time:  time_limit, errors: ['time'] })
    .then(async collected => {
      // Set a reason for the message footer
      end_reason = 'Answered!';
    })
    .catch(collected => {
      // Set a reason for the message footer
      end_reason = 'Timed out!';
    }).finally(() => {
      // Update the message
      const botEmbed = bot_message.embeds[0];
      const description = `${botEmbed.description.split('\n').map(l => `~~${l.trim()}~~`).join('\n')}`;

      botEmbed.setDescription(description)
        .setFooter(`${botEmbed.footer ? botEmbed.footer.text : ''}\n${end_reason}`)
        .setColor('#e74c3c');

      bot_message.edit({ embed: botEmbed }).catch((...args) => warn('Unable to edit quiz question', ...args));
    });

  // Post another question once the timer finishes
  setTimeout(() => newQuiz(guild), time_limit);
};

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

  const description = ['Name the Evolution!'];
  description.push(`**+${amount} ${money_icon}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Who can this Pokemon evolve to?')
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

  const description = ['Name the Prevolution!'];
  description.push(`**+${amount} ${money_icon}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** _(shiny)_`);
    amount += shiny_amount;
  }

  const embed = new MessageEmbed()
    .setTitle('Who does this Pokemon evolve from?')
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

module.exports = {
  newQuiz,
  postHappyHour,
};
