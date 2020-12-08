const {
  addStatistic,
} = require('../database.js');

const betRegex = /^(\d+|all|half|quarter|random|\d+e\d{1,2}|\d{1,2}%|100%)$/;

// if it fails the regex check or is less than 0, then it is invalid (NaN isn't <= 0)
const invalidBet = bet => !betRegex.test(bet) || +bet <= 0;
const validBet = bet => !invalidBet(bet);

const calcBetAmount = (bet, balance) => {
  if (bet.toString().endsWith('%')){
    const percentage = parseInt(bet) / 100;
    return Math.max(1, Math.floor(balance * percentage));
  }
  switch(bet) {
    case 'all':
      return balance;
    case 'half':
      return Math.max(1, Math.floor(balance / 2));
    case 'quarter':
      return Math.max(1, Math.floor(balance / 4));
    case 'random':
      return Math.max(1, Math.floor(Math.random() * balance));
    default:
      return +bet;
  }
};

const addBetStatistics = (user, bet, winnings) => {
  // Total times gambled
  addStatistic(user, 'gc_games_played');
  // Total amount bet
  addStatistic(user, 'gc_coins_bet', bet);
  // Total amount won
  addStatistic(user, 'gc_coins_won', winnings);

  // Total wins
  if (winnings > 0) addStatistic(user, 'gc_games_won');
  // Total ties
  if (winnings == 0) addStatistic(user, 'gc_games_tied');
  // Total losses
  if (winnings < 0) addStatistic(user, 'gc_games_lost');
};

module.exports = {
  betRegex,
  validBet,
  calcBetAmount,
  addBetStatistics,
};
