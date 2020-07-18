const { dateTime } = require('../helpers.js');

module.exports = {
  name        : 'time',
  aliases     : [],
  description : 'Get the current server time',
  args        : [],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_CHANNELS', 'MANAGE_MESSAGES'],
  execute     : async (msg, args) => {
    const data = ['Current server time:', `\`${dateTime()}\``];
    return msg.channel.send(data);
  },
};
