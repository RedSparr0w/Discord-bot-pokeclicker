const {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
} = require('./constants.js');

const dateToString = date => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, 0)}-${date.getDate().toString().padStart(2, 0)}`;
const dateToUTCString = date => date.toISOString().substr(0, 10);
const formatSecondsFullLetters = (input) => {
  // Temporarily recast to number until everything is in modules
  if (Number.isNaN(Number(input)) || input === 0) { return '-'; }
  let time = Math.abs(input * 1000);
  const times = [];

  if (time >= WEEK) {
    const weeks = Math.floor(time / WEEK);
    times.push(`${weeks}w`.padStart(3, '0'));
    time %= WEEK;
  }
  if (time >= DAY || times.length) {
    const days = Math.floor(time / DAY);
    times.push(`${days}d`.padStart(3, '0'));
    time %= DAY;
  }
  if (time >= HOUR || times.length) {
    const hours = Math.floor(time / HOUR);
    times.push(`${hours}h`.padStart(3, '0'));
    time %= HOUR;
  }
  if (time >= MINUTE || times.length) {
    const minutes = Math.floor(time / MINUTE);
    times.push(`${minutes}m`.padStart(3, '0'));
    time %= MINUTE;
  }
  if (time >= SECOND || times.length) {
    const seconds = Math.floor(time / SECOND);
    times.push(`${seconds}s`.padStart(3, '0'));
  }
  return times.slice(0, 3).join(' ');
};

module.exports = {
  dateToString,
  dateToUTCString,
  formatSecondsFullLetters,
};
