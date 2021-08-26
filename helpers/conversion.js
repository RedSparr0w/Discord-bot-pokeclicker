const {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
} = require('./constants.js');

const dateToString = date => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, 0)}-${date.getDate().toString().padStart(2, 0)}`;
const dateToUTCString = date => date.toISOString().substr(0, 10);

const formatDateToString = (date) => {
  const s = (amt) => amt != 1 ? 's' : '';
  date = typeof date == 'number' ? date : +date;
  const weeks = Math.floor(date / WEEK);
  const days = Math.floor(date % WEEK / DAY);
  const hours = Math.floor(date % DAY / HOUR);
  const minutes = Math.floor(date % HOUR / MINUTE);
  const seconds = Math.floor(date % MINUTE / SECOND);
  let timeRemaining = '';
  if (weeks) timeRemaining += `${weeks} week${s(weeks)} `;
  if (days) timeRemaining += `${days} day${s(days)} `;
  if (hours) timeRemaining += `${hours} hour${s(hours)} `;
  if (minutes) timeRemaining += `${minutes} minute${s(minutes)} `;
  if (seconds) timeRemaining += `${seconds} second${s(seconds)}`;
  return timeRemaining.trim() || '0 seconds';
};

const formatSecondsFullLetters = (input, hide_zero = false) => {
  // Temporarily recast to number until everything is in modules
  if (Number.isNaN(Number(input)) || input === 0) {
    return '-';
  }
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
  return times.slice(0, 3).filter(a => !(hide_zero && a.startsWith('00'))).join(' ');
};

module.exports = {
  dateToString,
  dateToUTCString,
  formatDateToString,
  formatSecondsFullLetters,
};
