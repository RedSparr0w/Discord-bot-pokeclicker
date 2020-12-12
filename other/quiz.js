const { MessageEmbed } = require('discord.js');
const { quizChannelID, website } = require('../config.js');
const { addAmount, addStatistic, addPurchased } = require('../database.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
  MINUTE,
  HOUR,
} = require('../helpers.js');

const money_icon = '<:money:737206931759824918>';

// Between 1 and 10 minutes
const getTimeLimit = () => Math.floor(Math.random() * (9 * MINUTE)) + (1 * MINUTE);
const isHappyHour = () => Date.now() % (9 * HOUR) < HOUR;
// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;
const getShinyAmount = () => 100;
const isShiny = chance => !Math.floor(Math.random() * chance);

const postHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  const embed = new MessageEmbed()
    .setTitle('It\'s Happy Hour!')
    .setDescription(['For the next 1 hour, questions will be posted 3x as fast!', '', 'Good Luck!'])
    .setColor('#2ecc71');

  return await quiz_channel.send({ embed });
};

const newQuiz = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  // Generate and send a random question
  const quiz = randomFromArray(quizTypes)();

  // Time limit in minutes (2 → 10 minutes)
  let time_limit = getTimeLimit();

  const happyHour = isHappyHour();

  // 3 x more questions
  if (happyHour) {
    time_limit /= 3;
    quiz.embed.setFooter('Happy Hour! (3x faster questions)');
  }

  const bot_message = await quiz_channel.send({ embed: quiz.embed });

  // Which messages are we trying to catch
  const filter = m => quiz.answer.test(m.content);

  // Reason for footer once finished
  let end_reason = 'Closed';

  // errors: ['time'] treats ending because of the time limit as an error
  quiz_channel.awaitMessages(filter, { max: 1, time:  time_limit, errors: ['time'] })
    .then(async collected => {
      // Set a reason for the message footer
      end_reason = 'Answered!';

      const m = collected.first();
      const user = m.author;

      // Add coins to the users balance
      const balance = await addAmount(user, quiz.amount);
      const answered = await addStatistic(user, 'qz_answered');
      addStatistic(user, 'qz_coins_won', quiz.amount);

      // If user has answered more than 100 questions, give them the Marsh Badge
      if (answered >= 100) {
        await addPurchased(user, 'badge', 4);
      }

      const description = [
        `${user}`,
        '**CORRECT!**',
        `**+${quiz.amount} ${money_icon}**`,
      ];

      const embed = new MessageEmbed()
        .setDescription(description)
        .setFooter(`Balance: ${balance.toLocaleString('en-US')}`)
        .setColor('#2ecc71');

      m.channel.send({ embed });
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

      bot_message.edit({ embed: botEmbed });
    });

  // Post another question once the timer finishes
  setTimeout(() => newQuiz(guild), time_limit);
};

const whosThatPokemon = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^${pokemon.name.replace(/\s?\(.+/, '')}\\b`, 'i');
  
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

const quizTypes = [
  whosThatPokemon,
  whosThatPokemon,
  whosThatPokemon,
  whosThatPokemon,
  pokemonRegion,
  pokemonRegion,
  pokemonType,
  pokemonType,
  pokemonID,
];

module.exports = {
  newQuiz,
  postHappyHour,
};
