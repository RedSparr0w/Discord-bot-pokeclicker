const sqlite = require('sqlite');

async function getDB(){
  return await sqlite.open('./database.sqlite');
}

async function setupDB(){
  const db = await getDB();
  await Promise.all([
    db.run('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT(32) UNIQUE ON CONFLICT IGNORE NOT NULL, tag TEXT(64) NOT NULL)'),
    db.run('CREATE TABLE IF NOT EXISTS guilds(id INTEGER PRIMARY KEY AUTOINCREMENT, guild TEXT(32) UNIQUE ON CONFLICT IGNORE NOT NULL, name TEXT(64) NOT NULL)'),
    db.run('CREATE TABLE IF NOT EXISTS points(guild INTEGER NOT NULL, user INTEGER NOT NULL, points BIGINT(12) NOT NULL default \'0\', PRIMARY KEY (guild, user), FOREIGN KEY (guild) REFERENCES guilds (id) ON DELETE CASCADE, FOREIGN KEY (user) REFERENCES users (id) ON DELETE CASCADE, UNIQUE(guild, user) ON CONFLICT REPLACE)'),
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

async function getGuildID(guild){
  const data = {
    $guild: guild.id,
    $name: guild.name,
  };

  const db = await getDB();
  await db.run('INSERT OR REPLACE INTO guilds (id, guild, name) values ((SELECT id FROM guilds WHERE guild = $guild), $guild, $name);', data);
  const { guild_id = 0 } = await db.get('SELECT last_insert_rowid() AS guild_id;');
  db.close();

  return guild_id;
}

async function getPoints(guild, user, table = 'points'){
  const [
    db,
    guild_id,
    user_id,
  ] = await Promise.all([
    getDB(),
    getGuildID(guild),
    getUserID(user),
  ]);

  const { points } = await db.get(`SELECT points FROM ${table} WHERE  guild=? AND user=?`, guild_id, user_id) || { points: 0 };
  db.close();

  return +points;
}

async function addPoints(guild, user, points = 1, table = 'points'){
  // Check points is valid
  points = +points;
  if (isNaN(points)) return;
  points += await getPoints(guild, user, table);

  const [
    db,
    guild_id,
    user_id,
  ] = await Promise.all([
    getDB(),
    getGuildID(guild),
    getUserID(user),
  ]);

  const data = {
    $guild_id: guild_id,
    $user_id: user_id,
    $points: points,
  };

  await db.run(`INSERT OR REPLACE INTO ${table} (guild, user, points) VALUES ($guild_id, $user_id, $points)`, data);
  db.close();

  return points;
}

async function getTop(guild, amount = 10, table = 'points'){
  // amount must be between 1 - 50
  amount = Math.max(1, Math.min(50, amount));

  const [
    db,
    guild_id,
  ] = await Promise.all([
    getDB(),
    getGuildID(guild),
  ]);

  const results = await db.all(`SELECT users.user, points  FROM ${table} INNER JOIN users ON users.id = ${table}.user WHERE guild = ${guild_id} ORDER BY points DESC LIMIT ${amount}`);
  db.close();

  return results;
}

module.exports = {
  setupDB,
  getPoints,
  addPoints,
  getTop,
};
