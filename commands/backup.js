const { EmbedBuilder } = require('discord.js');
const { backupDB } = require('../database.js');

module.exports = {
  type        : 'message',
  name        : 'backup',
  aliases     : [],
  description : 'Backup database',
  args        : [],
  guildOnly   : true,
  cooldown    : 0.1,
  botperms    : ['AttachFiles'],
  userperms   : ['ManageGuild'],
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    msg.channel.send({
      embeds: [new EmbedBuilder().setColor('#2ecc71').setDescription('Backed up database!')],
    });
    backupDB(msg.guild);
  },
};
