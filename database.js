const sqlite = require('sqlite');
const { backupChannelID } = require('./config.js');
const { MessageAttachment } = require('discord.js');
const { warn } = require('./helpers/logging.js');
const { version: botVersion } = require('./package.json');

// current version, possibly older version
const isOlderVersion = (version, compareVersion) => compareVersion.localeCompare(version, undefined, { numeric: true }) === 1;

const database_dir = './db/';
const database_filename = 'database.sqlite';
const database_fullpath = database_dir + database_filename;

async function getDB(){
  return await sqlite.open(database_fullpath);
}

async function setupDB(){
  const db = await getDB();
  await Promise.all([
    // Keep track of any application data we need
    db.run('CREATE TABLE IF NOT EXISTS application(name TEXT(1024) UNIQUE ON CONFLICT IGNORE NOT NULL, value TEXT(1024) NOT NULL, PRIMARY KEY (name))'),
    // User data
    db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT(32) UNIQUE ON CONFLICT IGNORE NOT NULL, tag TEXT(64) NOT NULL)'),
    db.run('CREATE TABLE IF NOT EXISTS trainer_card(user INTEGER NOT NULL, background INT(3) NOT NULL default \'0\', trainer INT(3) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS purchased(user INTEGER NOT NULL, background TEXT(1024) NOT NULL default \'1\', trainer TEXT(1024) NOT NULL default \'11\', badge TEXT(1024) NOT NULL default \'\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS coins(user INTEGER NOT NULL, amount BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS daily_claim(user INTEGER NOT NULL, last_claim TEXT(24) NOT NULL default \'0\', streak BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS timely_claim(user INTEGER NOT NULL, last_claim TEXT(24) NOT NULL default \'0\', streak BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    // User Statistics
    db.run('CREATE TABLE IF NOT EXISTS statistic_types(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT(32) UNIQUE ON CONFLICT IGNORE NOT NULL)'),
    db.run('CREATE TABLE IF NOT EXISTS statistics(user INTEGER NOT NULL, type TEXT(1024) NOT NULL, value BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user, type), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, FOREIGN KEY (type) REFERENCES statistic_types (id) ON DELETE CASCADE, UNIQUE(user, type) ON CONFLICT REPLACE)'),
  ]);

  db.close();
  await updateDB();
  return;
}

async function updateDB(){
  const db = await getDB();
  let version = await db.get('SELECT * FROM application WHERE name=?', 'version');

  // Will only update the version if it doesn't already exist
  if (!version || !version.value) {
    await db.run('INSERT INTO application (name, value) values (?, ?)', 'version', botVersion);
    version = botVersion;
  } else {
    version = version.value;
  }

  if (isOlderVersion(version, '1.1.0')) {
    version = '1.1.0';
    await db.run('ALTER TABLE purchased ADD badge TEXT(1024) NOT NULL default \'\'');
    await db.run('INSERT OR REPLACE INTO application (name, value) values (?, ?)', 'version', version);
  }
  
  await db.run('INSERT OR REPLACE INTO application (name, value) values (?, ?)', 'version', botVersion);

  db.close();
}

async function backupDB(guild){
  // Check if this guild has a backup channel
  const backup_channel = await guild.channels.cache.find(c => c.id == backupChannelID);
  if (!backup_channel) return warn('Backup channel not found!');

  const attachment = await new MessageAttachment().setFile(database_fullpath, 'database.backup.sqlite');

  backup_channel.send(`__***Database Backup:***__\n_${new Date().toJSON().replace(/T/g,' ').replace(/\.\w+$/,'')}_`, {
    files: [attachment],
  }).catch(warn);
}

async function getUserID(user){
  const data = {
    $user: user.id,
    $tag: user.tag,
  };

  const db = await getDB();
  await db.run('INSERT OR REPLACE INTO users (id, user, tag) values ((SELECT id FROM users WHERE user = $user), $user, $tag);', data);
  const { user_id = 0 } = await db.get('SELECT last_insert_rowid() AS user_id;');
  db.close();

  return user_id;
}

async function getAmount(user, table = 'coins'){
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get(`SELECT amount FROM ${table} WHERE user=?`, user_id);
  // If user doesn't exist yet, set them up (with 1000 coins)
  if (!result) {
    await db.run(`INSERT OR REPLACE INTO ${table} (user, amount) VALUES (?, 1000)`, user_id);
    // try get the users points again
    result = await db.get(`SELECT amount FROM ${table} WHERE user=?`, user_id);
  }
  db.close();

  const { amount = 0 } = result || {};

  return +amount;
}

async function addAmount(user, amount = 1, table = 'coins'){
  // Check amount is valid
  amount = +amount;
  if (isNaN(amount)) return;
  amount += await getAmount(user, table);

  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  // If user has more than 25k coins, give them the Soul Badge
  if (amount >= 25e3) {
    addPurchased(user, 'badge', 5);
  }

  const data = {
    $user_id: user_id,
    $amount: amount,
  };

  await db.run(`UPDATE ${table} SET amount=$amount WHERE user=$user_id`, data);
  db.close();

  return amount;
}

async function removeAmount(user, amount = 1, table = 'coins'){
  return await addAmount(user, -amount, table);
}

async function setAmount(user, amount = 1, table = 'coins'){
  // Check amount is valid
  amount = +amount;
  if (isNaN(amount)) return;

  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  const data = {
    $user_id: user_id,
    $amount: amount,
  };

  await db.run(`UPDATE ${table} SET amount=$amount WHERE user=$user_id`, data);
  db.close();

  return amount;
}

async function getTop(amount = 10, table = 'coins'){
  if (isNaN(amount)) amount = 10;
  amount = Math.max(1, amount);

  const db = await getDB();
  const results = await db.all(`SELECT users.user, amount, RANK () OVER ( ORDER BY amount DESC ) rank FROM ${table} INNER JOIN users ON users.id = ${table}.user ORDER BY amount DESC LIMIT ${amount}`);
  db.close();

  return results;
}

async function getRank(user, table = 'coins'){
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  const result = await db.get('SELECT * FROM ( SELECT user, amount, RANK () OVER ( ORDER BY amount DESC ) rank FROM coins ) WHERE user=?', user_id);
  db.close();

  return result.rank || 0;
}

async function getTrainerCard(user){
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get('SELECT * FROM trainer_card WHERE user=?', user_id);
  // If user doesn't exist yet, set them up
  if (!result) {
    await db.run('INSERT OR REPLACE INTO trainer_card (user) VALUES (?)', user_id);
    // try get the users points again
    result = await db.get('SELECT * FROM trainer_card WHERE user=?', user_id);
  }
  db.close();

  return result;
}

async function setTrainerCard(user, type, index){
  if (!type) return console.error('No type specified to set on trainer card');
  if (index == undefined) return console.error('No item index specified to set on trainer card');
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
    getTrainerCard(user), // We want this incase the profile isn't created yet
  ]);

  const result = await db.run(`UPDATE trainer_card SET ${type}=? WHERE user=?`, index, user_id);
  db.close();

  return result;
}

async function getPurchased(user, type){
  if (!type) return console.error('No purchase type to get specified');
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get(`SELECT ${type} FROM purchased WHERE user=?`, user_id);
  // If user doesn't exist yet, set them up
  if (!result) {
    await db.run('INSERT OR REPLACE INTO purchased (user) VALUES (?)', user_id);
    // try get the users points again
    result = await db.get(`SELECT ${type} FROM purchased WHERE user=?`, user_id);
  }
  db.close();

  return result[type].split('').map(Number);
}

async function addPurchased(user, type, index){
  if (!type) return console.error('No type to purchase specified');
  if (index == undefined) return console.error('No item index to purchase specified');

  // Get currently purchased items
  let purchased = await getPurchased(user, type);
  // Add our item
  purchased[index] = 1;
  // Any empty items need to be 0
  purchased = Array.from(purchased, i => i ? 1 : 0).join('');

  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  const result = await db.run(`UPDATE purchased SET ${type}=? WHERE user=?`, purchased, user_id);
  db.close();

  return result;
}

async function getStatisticTypeID(type){
  const data = {
    $type: type,
  };

  const db = await getDB();
  await db.run('INSERT OR REPLACE INTO statistic_types (id, name) values ((SELECT id FROM statistic_types WHERE name = $type), $type);', data);
  const { type_id = 0 } = await db.get('SELECT last_insert_rowid() AS type_id;');
  db.close();

  return type_id;
}

async function getStatistic(user, type){
  const [
    db,
    user_id,
    type_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
    getStatisticTypeID(type),
  ]);

  let result = await db.get('SELECT value FROM statistics WHERE user=? AND type=?', user_id, type_id);
  // If user doesn't exist yet, set them up (with 1000 coins)
  if (!result) {
    await db.run('INSERT OR REPLACE INTO statistics (user, type) VALUES (?, ?)', user_id, type_id);
    // try get the users points again
    result = await db.get('SELECT value FROM statistics WHERE user=? AND type=?', user_id, type_id);
  }
  db.close();

  const { value = 0 } = result || {};

  return +value;
}

async function addStatistic(user, type, amount = 1){
  // Check amount is valid
  amount = +amount;
  if (isNaN(amount)) return;
  amount += await getStatistic(user, type);

  const [
    db,
    user_id,
    type_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
    getStatisticTypeID(type),
  ]);

  const data = {
    $type_id: type_id,
    $user_id: user_id,
    $amount: amount,
  };

  await db.run('UPDATE statistics SET value=$amount WHERE user=$user_id AND type=$type_id', data);
  db.close();

  return amount;
}

module.exports = {
  getDB,
  setupDB,
  backupDB,
  getUserID,
  getAmount,
  addAmount,
  setAmount,
  removeAmount,
  getTop,
  getRank,
  getTrainerCard,
  setTrainerCard,
  getPurchased,
  addPurchased,
  getStatisticTypeID,
  getStatistic,
  addStatistic,
};
