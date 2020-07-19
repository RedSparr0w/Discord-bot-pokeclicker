const { MessageEmbed } = require('discord.js');
const {
  DailyDeal,
  UndergroundItem,
} = require('../helpers.js');

module.exports = {
  name        : 'dailydeal',
  aliases     : ['dd', 'daily', 'deal', 'deals', 'dailydeals', 'ug', 'underground'],
  description : 'Get a list of daily deals for the next 5 days',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const embed = new MessageEmbed()
      .setTitle('Upcoming Daily Deals')
      //.setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter('Data is up to date as of v0.4.12');

    // Calculate name padding
    const allItemsLength = UndergroundItem.list.map(item => item.name.length);
    const padding = Math.max(...allItemsLength);

    const today = new Date();
    const dateToCheck = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    for (let i = 0; i < 5; i++) {
      DailyDeal.generateDeals(5, dateToCheck);
      const description = ['```prolog'];
      DailyDeal.list.forEach(deal => {
        description.push(`${deal.amount1.toString().padStart(2, ' ')} × ${deal.item1.name.toString().padEnd(padding, ' ')}  →  ${deal.amount2.toString().padStart(2, ' ')} × ${deal.item2.name}`);
      });
      description.push('```');
      embed.addField(`❯ ${dateToCheck.getFullYear()}-${(dateToCheck.getMonth() + 1).toString().padStart(2, 0)}-${dateToCheck.getDate().toString().padStart(2, 0)}`, description.join('\n'));
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }

    msg.channel.send({ embed });
  },
};
