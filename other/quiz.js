const { MessageEmbed } = require('discord.js');
const { quizChannelID, website } = require('../config.js');
const { addAmount, addStatistic } = require('../database.js');
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  GameConstants,
} = require('../helpers.js');

const money_icon = '<:money:737206931759824918>';


const newQuiz = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(c => c.id == quizChannelID);
  if (!quiz_channel) return;

  // Generate and send a random question
  const quiz = randomFromArray(quizTypes)();
  const bot_message = await quiz_channel.send({ embed: quiz.embed });

  // Time limit in minutes (2 → 10 minutes)
  const time_limit = getTimeLimit();
  // Which messages are we trying to catch
  const filter = m => quiz.answer.test(m.content);

  // Reason for footer once finished
  let end_reason = 'closed';

  // errors: ['time'] treats ending because of the time limit as an error
  quiz_channel.awaitMessages(filter, { max: 1, time:  time_limit, errors: ['time'] })
    .then(async collected => {
      // Set a reason for the message footer
      end_reason = 'answered!';

      const m = collected.first();
      const user = m.author;

      // Add coins to the users balance
      const balance = await addAmount(user, quiz.amount);
      addStatistic(user, 'qz_answered');
      addStatistic(user, 'qz_coins_won', quiz.amount);

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
      end_reason = 'timed out!';
    }).finally(() => {
      // Update the message
      const botEmbed = bot_message.embeds[0];
      const description = `${botEmbed.description.split('\n').map(l => `~~${l.trim()}~~`).join('\n')}`;

      botEmbed.setDescription(description)
        .setFooter(end_reason)
        .setColor('#e74c3c');

      bot_message.edit({ embed: botEmbed });
    });

  // Post another question once the timer finishes
  setTimeout(() => newQuiz(guild), time_limit);
};

// Between 1 and 10 minutes
const getTimeLimit = () => Math.floor(Math.random() * (9 * 60 * 1000)) + (1 * 60 * 1000);
// Between 10 and 50
const getAmount = () => Math.floor(Math.random() * 9) * 5 + 10;

const whosThatPokemon = () => {
  const pokemon = randomFromArray(pokemonList);
  const answer = new RegExp(`^${pokemon.name.replace(/\s?\(.+/, '')}\\b`, 'i');
  
  const amount = getAmount();

  const shiny = !Math.floor(Math.random() * 128);

  const embed = new MessageEmbed()
    .setTitle('Who\'s that Pokemon?')
    .setDescription(`Name the Pokemon!\n**+${amount} ${money_icon}**`)
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

  const amount = getAmount();

  const shiny = !Math.floor(Math.random() * 128);

  const embed = new MessageEmbed()
    .setTitle('What\'s the type?')
    .setDescription(`What is this Pokemons type(s)?\n**+${amount} ${money_icon}**`)
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
  const answer = new RegExp(`^#?${pokemon.id}\\b`, 'i');
  
  const amount = getAmount();

  const shiny = !Math.floor(Math.random() * 128);

  const embed = new MessageEmbed()
    .setTitle('What\'s the ID?')
    .setDescription(`What is this Pokemons national Pokedex ID?\n**+${amount} ${money_icon}**`)
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
  
  const amount = getAmount();

  const shiny = !Math.floor(Math.random() * 128);

  const embed = new MessageEmbed()
    .setTitle('What\'s the Region?')
    .setDescription(`What is this Pokemons native region?\n**+${amount} ${money_icon}**`)
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
  pokemonRegion,
  pokemonID,
  pokemonType,
];

module.exports = {
  newQuiz,
};
