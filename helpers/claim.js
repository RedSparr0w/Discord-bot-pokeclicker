const { getDB, getUserID, addPurchased } = require('../database.js');
const { trainerCardBadgeTypes } = require('./trainer_card.js');

const getLastClaim = async (user, table) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  let result = await db.get(`SELECT last_claim, streak, paused FROM ${table} WHERE user=?`, user_id);
  // If user doesn't exist yet, set them up
  if (!result) {
    await db.run(`INSERT OR REPLACE INTO ${table} (user) VALUES (?)`, user_id);
    // try get the users points again
    result = await db.get(`SELECT last_claim, streak, paused FROM ${table} WHERE user=?`, user_id);
  }
  db.close();
  const { last_claim = 0, streak = 0, paused = 0 } = result;

  if (table == 'timely_claim' && streak >= 500) {
    await addPurchased(user, 'badge', trainerCardBadgeTypes.Volcano);
  }

  if (table == 'daily_claim' && streak >= 100) {
    await addPurchased(user, 'badge', trainerCardBadgeTypes.Earth);
  }

  // Return last_claim as a date and streak
  return { last_claim: new Date(last_claim), streak, paused: !!paused };
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

  await db.run(`UPDATE ${table} SET last_claim=$date, paused=0 WHERE user=$user_id`, data);
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

  await db.run(`UPDATE ${table} SET streak=streak+1, paused=0 WHERE user=?`, user_id);
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

const pauseClaimStreak = async (user) => {
  const [
    db,
    user_id,
  ] = await Promise.all([
    getDB(),
    getUserID(user),
  ]);

  await db.run('UPDATE daily_claim SET paused=1 WHERE user=?', user_id);
  await db.run('UPDATE timely_claim SET paused=1 WHERE user=?', user_id);
  db.close();
};

const getRecentClaims = async (table, offset) => {
  const db = await getDB();
  const date = new Date();
  date.setTime(date.getTime() - offset);
  const claims = await db.all(`SELECT COUNT(*) AS count FROM ${table} WHERE last_claim >= ?`, date.toJSON());
  db.close();
  return claims.map((claim) => claim.count)[0];
};

module.exports = {
  getLastClaim,
  updateClaimDate,
  bumpClaimStreak,
  resetClaimStreak,
  pauseClaimStreak,
  getRecentClaims,
};
