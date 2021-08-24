const { mutedRoleID } = require('../../config.js');
const { getScheduleItems, clearScheduleItems } = require('../../database.js');

const checkScheduledItems = async (client) => {
  const scheduled = await getScheduleItems();
  scheduled.forEach(item => {
    switch(item.type) {
      case 'un-mute':
        return unmute(client, item);
    }
  });

  // Clear the scheduled items we have just processed
  clearScheduleItems(scheduled.map(r => r.id));
};

const unmute = async (client, item) => {
  const userID = item.user;
  const [, guildID, time] = item.value.match(/(\d+)\|([\w\s]+)/);
  const member = await getMember(client, guildID, userID);
  await member?.roles.remove(mutedRoleID, `User unmuted (scheduled - ${time})`);
};

const getMember = async (client, guildID, userID) => await client.guilds.cache.get(guildID)?.members.fetch(userID, false).catch(O_o=>{});

//const getUser = async (client, userID) => await client.users.fetch(userID, false).catch(O_o=>{});

module.exports = {
  checkScheduledItems,
};
