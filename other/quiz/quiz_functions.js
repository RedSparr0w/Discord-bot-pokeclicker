const {
  HOUR,
} = require('../../helpers.js');

const isHappyHour = () => Date.now() % (9 * HOUR) < HOUR;

module.exports = {
  isHappyHour,
};
