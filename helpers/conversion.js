const dateToString = date => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, 0)}-${date.getDate().toString().padStart(2, 0)}`;
const dateToUTCString = date => date.toISOString().substr(0, 10);

module.exports = {
  dateToString,
  dateToUTCString,
};
