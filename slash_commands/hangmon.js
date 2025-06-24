const { EmbedBuilder } = require('discord.js');
const { serverIcons } = require('../config.js');
const HangmanRunner = require('../other/hangmon/hangmon_functions');
const { SECOND, MINUTE } =  require('../helpers/constants');

const GAME_TIME = 3 * MINUTE; // Minutes a game lasts for
const GUESS_COOLDOWN = 5 * SECOND; // Seconds between two allowed guesses
const REACTIONS = { WAIT: '⏳', SUCCESS: '🟢', FAILURE: '🔴' };
const COLORS = { NEUTRAL: '#3498DB', SUCCESS: '#00BC8C', FAILURE: '#E74C3C' };

let cooldowns = {};

const canGuessNow = (user) => {
  const lastTime = Date.now();
  if ((cooldowns[user] ?? 0) + GUESS_COOLDOWN <= lastTime) {
    cooldowns[user] = lastTime;
    return true;
  }
  return false;
};

const formatWord = (word) => word.map(l => l == '_' ? `__\\${l}__` : (l == ' ' ? `\u17B5${l}\u17B5` : l)).join(' ');
// Because Discord embeding uses trimming and squeezes repeated spaces chars...
const formatScaffold = (scaffold) => `\n${scaffold}`.replace(/(?<=\s) /g, '\u200B ');

const generateGameDisplay = (endDate) => {
  const word = HangmanRunner.getWordDisplayLetters();
  const letters = HangmanRunner.getLetters();
  const scaffold = formatScaffold(HangmanRunner.getScaffold());
  const embed = new EmbedBuilder().setTitle('Who\'s that Pokémon?').setColor(COLORS.NEUTRAL)
    .setDescription(`${formatWord(word)}\n${scaffold}\n${letters.length ? `Previous attempts: ${letters.join('')}\n` : ''}Game Over <t:${Math.ceil(endDate / SECOND)}:R>`);
  return { embeds: [embed] };
};

const generateGameOverDisplay = () => {
  const embed = new EmbedBuilder()
    .setTitle(HangmanRunner.isWon() ? (HangmanRunner.getGuesser() ? 'You guessed the Pokémon!' : 'Game completed!') : 'Game Over')
    .setDescription(`${formatWord(HangmanRunner.getClearWordLetters())}\n\n${HangmanRunner.isWon() ? '' : formatScaffold(HangmanRunner.getScaffold())}`)
    .setImage(HangmanRunner.getPokemonImageLink())
    .setColor(HangmanRunner.isWon() ? COLORS.SUCCESS : COLORS.FAILURE);
  return {embeds : [embed] };
};

const guessFilter = (msg) => {
  if (!msg.author || msg.author.bot) {
    return false;
  }
  return msg.content.toLowerCase().startsWith('guess ') || msg.content.length == 1;
};

module.exports = {
  name        : 'hangmon',
  aliases     : [],
  description : 'Guess the Pokémon in this Pokémon-flavored Hangman.\nType a letter or `guess [<letter>|<Pokémon>]`.',
  args        : [],
  guildOnly   : true,
  cooldown    : 5,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['game-corner'],
  execute     : async (interaction) => {
    if (HangmanRunner.isRunning()) {
      const embed = new EmbedBuilder().setDescription('❌ The game already started\nℹ️ Write any letter or the name of a Pokémon, preceded by "guess", to participate').setColor(COLORS.FAILURE);
      interaction.reply({embeds: [embed]}).then(m => setTimeout(() => m.delete(), 10 * SECOND));

    } else {
      HangmanRunner.startHangman();
      cooldowns = {};
      const endDate = Date.now() + GAME_TIME;
      let lastMessage = null;

      // Delete the previous message everytime another is sent, avoid cluttering the UI
      const cleanMessages = (m) => {
        lastMessage?.delete();
        lastMessage = m;
      };

      interaction.reply(generateGameDisplay(endDate)).then(cleanMessages).catch(e => e);
      const collector = interaction.channel.createMessageCollector({filter: guessFilter, time: GAME_TIME});
      
      // After the command is run, users play by just sending messages
      collector.on('collect', msg => {
        const guess = msg.content.replace(/^guess\s+/i, '');
        if (!HangmanRunner.isValidGuess(guess)) {
          return;
        }
        if (!canGuessNow(msg.author)) {
          msg.react(REACTIONS.WAIT);
          return;
        }
        const res = HangmanRunner.tryNewGuess(guess, msg);
        msg.react(res ? REACTIONS.SUCCESS : REACTIONS.FAILURE);

        if (HangmanRunner.isFinished()) {
          // Too many failed attempts, or Pokémon name found
          msg.channel.send(generateGameOverDisplay()).then(cleanMessages);
          const rewards = HangmanRunner.calculateRewards();
          if (rewards.length) {
            const embed = new EmbedBuilder().setTitle('Rewards').setColor(COLORS.SUCCESS)
              .setDescription(`${HangmanRunner.getGuesser() ? `${HangmanRunner.getGuesser()}: **+${rewards.find(r => r.user.id == HangmanRunner.getGuesser().id).moneyReward} ${serverIcons.money} 🏅 **\n\n`: ''}${rewards.filter(r => r.user.id != HangmanRunner.getGuesser()?.id).map(r => `${r.user}: **+${r.moneyReward} ${serverIcons.money}**`).join('\n')}`);
            msg.channel.send({embeds: [embed]});
          }
          collector.stop();
          clearTimeout(gameOverTimeout);
        } else {
          msg.channel.send(generateGameDisplay(endDate)).then(cleanMessages);
        }
      });
      
      // We forcefully stop the game after a given time, cancelled by the game finishing early
      const gameOverTimeout = setTimeout(() => {
        HangmanRunner.endHangmanGame();
        collector.stop();
        lastMessage.channel.send(generateGameOverDisplay()).then(cleanMessages);
        const rewards = HangmanRunner.calculateRewards();
        if (rewards.length) {
          const embed = new EmbedBuilder().setTitle('Rewards').setColor(COLORS.SUCCESS)
            .setDescription(rewards.map(r => `${r.user}: **+${r.moneyReward} ${serverIcons.money}**`).join('\n'));
          lastMessage.channel.send({embeds: [embed]});
        }
      }, GAME_TIME);
    }
  },
};
