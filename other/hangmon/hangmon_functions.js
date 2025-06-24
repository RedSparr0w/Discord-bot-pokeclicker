const {
  pokemonList,
  randomFromArray,
} = require('../../helpers.js');
const { addAmount } = require('../../database.js');
const { website } = require('../../config.js');

let hangman = null;

const unownID = Math.floor(pokemonList.find(p => p.name.startsWith('Unown')).id);
const unownList = 'AEIYFMX?'.split('').map(l => `Unown (${l})`);

// ---MODEL---

// NIDORANF → NIDORAN F, PORYGONZ → PORYGON Z
const formatHangmanWord = (pokemon) => pokemon.toUpperCase().replace(/-(.)$/, ' $1').replace(/É/g, 'E').replace(/[^0-9A-Z ?]/g, '').replace(/NIDORAN(F|M)/, 'NIDORAN $1');

const formatHangmanGuess = (pokemon) => pokemon.toUpperCase().replace(/(\?)/g, '\\?').replace(/[^0-9A-ZÉ?\\]/g, '.?').replace(/É/g, '(E|É)');

// Generate a list with all valid Pokémon
const pokemonByLength = {};
pokemonList.forEach(p => {
  if (!p.id) {
    // No MissingNo.
    return;
  }
  if (Math.floor(p.id) == unownID && !unownList.includes(p.name)) {
    // Having to guess which of the 28 Unown it is, is unfunny, we only keep A, I, Y, F, M, X and ?
    return;
  }
  const length = formatHangmanWord(p.name).split(/\s*/).length;
  pokemonByLength[length] = (pokemonByLength[length] ?? []);
  pokemonByLength[length].push(p);
});
const eligiblePokemon = Object.values(pokemonByLength).reduce((eList, lengthList) => {
  if (lengthList.length >= 3) {
    // Needs at least 3 Pokémon with guess word of same length
    return [...eList, ...lengthList];
  }
  return eList;
}, []);

const balancedIDPool = [...new Set(eligiblePokemon.map(p => Math.floor(Math.abs(p.id))))];
const getRandomPokemon = () => {
  const selectID = randomFromArray(balancedIDPool);
  return randomFromArray(eligiblePokemon.filter(p => Math.floor(Math.abs(p.id)) == selectID));
};

const wordGuesses = (word) => [... new Set(word.split(/\s*/))];

// Compute letter frequency, final score is based on that
const letterScore = eligiblePokemon.reduce((f, p) => {
  const nameLetters = wordGuesses(formatHangmanWord(p.name));
  nameLetters.forEach(l => {
    f[l] = (f[l] ?? 0);
    f[l]++;
  });
  return f;
}, {});
Object.keys(letterScore).forEach(k => letterScore[k] = 2 + Math.pow(4 ** 3 / letterScore[k], 1 / 3));

const calculateRewards = () => {
  const wonMultiplier = isWon() ? 3 : 2;
  const nameLetters = wordGuesses(hangman.word);
  const wordScore = nameLetters.reduce((s, l) => s + letterScore[l], 0);
  const rewards = hangman.scores.map(s =>  ({user: s.user, moneyReward: Math.round(3 + Math.min(1, s.score / nameLetters.length) * wordScore * wonMultiplier)}));
  return rewards.sort((a, b) => b.moneyReward - a.moneyReward);
};

const isRunning = () => !!hangman && !isFinished();
const isFinished = () => hangman?.finished ?? true;
const isWon = () => !!hangman.guesser || hangman.word.split(/\s*/g).every(l => hangman.letters.includes(l));
const isLost = () => !scaffolds[hangman.misses + 1];
const isValidGuess = (guess) => /^[A-Z0-9É?]$/i.test(guess) && !hangman.letters.includes(guess.toUpperCase().replace(/É/, 'E')) || guess.length > 1;

const newGame = (pokemon) => ({ pokemon, letters: [], misses: 0, word: formatHangmanWord(pokemon.name), guess: formatHangmanGuess(pokemon.name), finished: false, guesser : null, scores : [] });

// ---CONTROLLER---

const startHangman = () => {
  if (isRunning()) {
    return false;
  }
  const pokemon = getRandomPokemon();
  hangman = newGame(pokemon);
  return true;
};

const tryNewGuess = (guess, guesser) => {
  if (!isRunning()) {
    return false;
  }
  let res;
  if (guess.length == 1) {
    res = tryGuessLetter(guess.toUpperCase(), guesser);
  } else {
    res = tryGuessPokemon(guess.toUpperCase(), guesser);
  }
  if (!res) {
    hangman.misses++;
  }
  if (isLost() || isWon()) {
    hangman.finished = true;
    calculateRewards().forEach(s => addAmount(s.user, s.moneyReward));
  }
  return res;
};

const tryGuessLetter = (guess, guesser) => {
  if (guess == 'É') {
    guess = 'E';
  }
  const res = hangman.word.includes(guess);
  hangman.letters.push(guess);
  if (res) {
    increaseScore(guesser);
  }
  return res;
};

const tryGuessPokemon = (guess, guesser) => {
  if (new RegExp(`^${hangman.guess}$`, 'i').test(guess)) {
    hangman.guesser = guesser;
    increaseScore(hangman.guesser, true);
    return true;
  }
  return false;
};

const increaseScore = (user, guessed = false) => {
  let userData = hangman.scores.find(d => d.user.id === user.id);
  if (!userData) {
    userData = {user, score: 0};
    hangman.scores.push(userData);
  }
  const value = guessed ? wordGuesses(hangman.word).length / 2 : 1;
  userData.score += value;
};

// forcibly lose the current game
const endHangmanGame = () => {
  hangman.finished = true;
  hangman.misses = scaffolds.length - 1;
};

// ---VIEW---

const getWordDisplayLetters = () => hangman.word.split('').map(l => hangman.letters.includes(l) ? l : `${l == ' ' ? l : '_'}`);
const getLetters = () => hangman.letters;
const getPokemonImageLink = () => {
  const shiny = Math.random() * 54 <= 1 ? 'shiny' : '';
  const female = hangman.pokemon.gender.visualDifference ? (Math.random() < hangman.pokemon.gender.femaleRatio ? '-f' : '') : '';
  return `${website}assets/images/${shiny ? 'shiny' : ''}pokemon/${hangman.pokemon.id}${female ? '-f' : ''}.png`;
};
const getClearWordLetters = () => hangman.word.split('');

const scaffolds = [ // I swear that looks good on screen!
  ['  +---+\n   |      |\n          |\n          |\n          |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n          |\n          |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n   |      |\n          |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n /|      |\n          |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n /|\\    |\n          |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n /|\\    |\n /       |\n          |\n======'],
  ['  +---+\n   |      |\n  O     |\n /|\\    |\n / \\    |\n          |\n======'],
];

const getScaffold = () => scaffolds[hangman.misses] ?? scaffolds[0];
const getGuesser = () => hangman.guesser;

module.exports = {
  isRunning,
  isFinished,
  isWon,
  startHangman,
  isValidGuess,
  tryNewGuess,
  getWordDisplayLetters,
  getScaffold,
  getLetters,
  calculateRewards,
  getPokemonImageLink,
  getClearWordLetters,
  endHangmanGame,
  getGuesser,
};
