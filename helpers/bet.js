const betRegex = /^(\d+|all|half|quarter)$/;

// if it fails the regex check or is less than 0, then it is invalid (NaN isn't <= 0)
const invalidBet = bet => !betRegex.test(bet) || +bet <= 0;
const validBet = bet => !invalidBet(bet);

const calcBetAmount = (bet, balance) => {
  switch(bet) {
    case 'all':
      return balance;
    case 'half':
      return Math.max(1, Math.floor(balance / 2));
    case 'quarter':
      return Math.max(1, Math.floor(balance / 4));
    default:
      return +bet;
  }
};

module.exports = {
  betRegex,
  validBet,
  calcBetAmount,
};
