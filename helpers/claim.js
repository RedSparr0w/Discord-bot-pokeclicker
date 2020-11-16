const { getDB, getUserID } = require('../database.js');

const getLastClaim = async (user, table) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get(`SELECT last_claim, streak FROM ${table} WHERE user=?`, user_id);
  // If user doesn't exist yet, set them up
  if (!result) {
    await db.run(`INSERT OR REPLACE INTO ${table} (user) VALUES (?)`, user_id);
    // try get the users points again
    result = await db.get(`SELECT last_claim, streak FROM ${table} WHERE user=?`, user_id);
  }
  db.close();
  const { last_claim = 0, streak = 0 } = result;
  // Return last_claim as a date and streak
  return { last_claim: new Date(last_claim), streak };
};

const updateClaimDate = async (user, table) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  const data = {
    $user_id: user_id,
    $date: new Date().toJSON(),
  };

  await db.run(`UPDATE ${table} SET last_claim=$date WHERE user=$user_id`, data);
  db.close();
};

const bumpClaimStreak = async (user, table) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  await db.run(`UPDATE ${table} SET streak=streak+1 WHERE user=?`, user_id);
  db.close();
};

const resetClaimStreak = async (user, table) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  await db.run(`UPDATE ${table} SET streak=0 WHERE user=?`, user_id);
  db.close();
};

module.exports = {
  getLastClaim,
  updateClaimDate,
  bumpClaimStreak,
  resetClaimStreak,
};
