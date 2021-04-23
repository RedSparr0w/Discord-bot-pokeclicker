const { MessageEmbed } = require('discord.js');
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
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    msg.channel.send({
      embed: new MessageEmbed().setColor('#2ecc71').setDescription('Backed up database!'),
    });
    backupDB(msg.guild);
  },
};
