const { MessageEmbed } = require('discord.js');
const { getStatisticTypes, getOverallStatistic } = require('../database.js');

module.exports = {
  name        : 'allstatistics',
  aliases     : ['allstats'],
  description : 'Get an overview of your statistics for this server',
  args        : ['type'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [],
  execute     : async (msg, args) => {
    const [type] = args;

    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!type) {
      embed.setDescription('No stat type mentioned..');
      return msg.channel.send({ embed });
    }

    const statTypes = await getStatisticTypes();

    const stat = statTypes.find(s => s.name == type);

    if (!stat) {
      embed.setTitle('Overall Statistics')
        .setDescription(statTypes.map(s => s.name));
      return msg.channel.send({ embed });
    }

    const stats = await getOverallStatistic(type);

    embed.setTitle(`__***${stats.name}***__`)
      .setColor('#3498db')
      .setDescription([
        `**❯ Users:** ${stats.users.toLocaleString('en-US')}`,
        `**❯ Value:** ${stats.value.toLocaleString('en-US')}`,
      ]);

    return msg.channel.send({ embed });
  },
};
