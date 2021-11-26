const { mutedRoleID } = require('../../config.js');
const { getScheduleItems, clearScheduleItems } = require('../../database.js');
const { error } = require('../../helpers.js');
const { modLog } = require('../mod/functions.js');

const checkScheduledItems = async (client) => {
  const scheduled = await getScheduleItems();
  scheduled.forEach(item => {
    try {
      switch(item.type) {
        case 'un-mute':
          return unmute(client, item);
      }
    } catch (e){
      error('Failed to run scheduled item\n', item, '\n', e);
    }
  });

  // Clear the scheduled items we have just processed
  clearScheduleItems(scheduled.map(r => r.id));
};

const unmute = async (client, item) => {
  const userID = item.user;
  const [, guildID, time] = item.value.match(/(\d+)\|([\w\s]+)/);
  const member = await getMember(client, guildID, userID);
  if (member) {
    await member.roles.remove(mutedRoleID, `User unmuted (scheduled - ${time})`);
    modLog(member.guild,
      `**Mod:** ${member.guild.me.toString()}
      **User:** ${member.toString()}
      **Action:** Unmuted
      **Reason:** _Scheduled_
      **Duration:** _${time}_`);
  }
};

const getMember = async (client, guildID, userID) => await client.guilds.cache.get(guildID)?.members.fetch(userID, false).catch(O_o=>{});

//const getUser = async (client, userID) => await client.users.fetch(userID, false).catch(O_o=>{});

module.exports = {
  checkScheduledItems,
};
