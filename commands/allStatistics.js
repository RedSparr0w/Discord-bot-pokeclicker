const { MessageEmbed } = require('discord.js');
const { getStatisticTypes, getOverallStatistic } = require('../database.js');

module.exports = {
  name        : 'allstatistics',
  aliases     : ['allstats'],
  description : 'Get an overview of your statistics for this server',
  args        : ['type?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [],
  execute     : async (msg, args) => {
    const [type] = args;

    const embed = new MessageEmbed().setColor('#e74c3c');

    const statTypes = await getStatisticTypes();

    if (!type) {
      const results = await Promise.all(statTypes.map(s => getOverallStatistic(s.name)));

      const padding = {
        name: Math.max(4, ...results.map(r => r.name.length)),
        users: Math.max(5, ...results.map(r => r.users.toLocaleString('en-US').length)),
        value: Math.max(5, ...results.map(r => r.value.toLocaleString('en-US').length)),
      };

      embed.setTitle('__***Overall Statistics***__')
        .setColor('#3498db')
        .setDescription(['```js', `${'name'.padEnd(padding.name, ' ')} | ${'users'.padStart(padding.users, ' ')} | ${'value'.padStart(padding.value, ' ')}`, ''.padStart(6 + padding.name + padding.users + padding.value, '-'), ...results.map(r => `${r.name.padEnd(padding.name, ' ')} | ${r.users.toLocaleString('en-US').padStart(padding.users, ' ')} | ${r.value.toLocaleString('en-US').padStart(padding.value, ' ')}`), '```']);

      return msg.channel.send({ embed });
    } else {
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
    }
  },
};
