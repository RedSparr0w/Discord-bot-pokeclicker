const { backupDB } = require('../database.js');

module.exports = {
  name        : 'backup',
  aliases     : [],
  description : 'Backup database',
  args        : [],
  guildOnly   : true,
  cooldown    : 0.1,
  botperms    : ['ATTACH_FILES'],
  userperms   : ['MANAGE_GUILD'],
  execute     : async (msg, args) => {
    backupDB(msg.guild);
  },
};
