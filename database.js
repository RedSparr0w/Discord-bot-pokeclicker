const sqlite = require('sqlite');

async function getDB(){
  return await sqlite.open('./db/database.sqlite');
}

async function setupDB(){
  const db = await getDB();
  await Promise.all([
    db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT(32) UNIQUE ON CONFLICT IGNORE NOT NULL, tag TEXT(64) NOT NULL)'),
    db.run('CREATE TABLE IF NOT EXISTS coins(user INTEGER NOT NULL, amount BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS daily_claim(user INTEGER NOT NULL, last_claim TEXT(24) NOT NULL default \'0\', streak BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
    db.run('CREATE TABLE IF NOT EXISTS timely_claim(user INTEGER NOT NULL, last_claim TEXT(24) NOT NULL default \'0\', streak BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (user), FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(user) ON CONFLICT REPLACE)'),
  ]);
  db.close();
  return;
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
  // amount must be between 1 - 50
  if (isNaN(amount)) amount = 10;
  amount = +Math.max(1, Math.min(50, amount));

  const db = await getDB();
  const results = await db.all(`SELECT users.user, amount FROM ${table} INNER JOIN users ON users.id = ${table}.user ORDER BY amount DESC LIMIT ${amount}`);
  db.close();

  return results;
}

module.exports = {
  getDB,
  setupDB,
  getUserID,
  getAmount,
  addAmount,
  setAmount,
  removeAmount,
  getTop,
};
