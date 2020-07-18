const fs = require('fs');
let helpers = {};

const helperFiles = fs.readdirSync('./helpers').filter(file => file.endsWith('.js'));

for (const file of helperFiles) {
  const helper = require(`./helpers/${file}`);
  helpers = { ...helpers, ...helper };
}

module.exports = helpers;
