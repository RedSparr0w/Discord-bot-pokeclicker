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
    const dateToCheck = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours() - 13);

    const calculateProfitString = (deal) => {
      if (deal.item1.value >= 100 || deal.item1.value <= 1) deal.item1.value = 0;
      if (deal.item2.value >= 100 || deal.item2.value <= 1) deal.item2.value = 0;
      if (deal.item1.value || deal.item2.value) {
        // An item is worth diamonds
        const profit = (deal.item2.value * deal.amount2) - (deal.item1.value * deal.amount1);
        return profit == 0 ? '---' : profit > 0 ? `+${profit.toString().padEnd(2, ' ')}💎` : `${profit.toString().padEnd(3, ' ')}💎`;
      } else {
        // Neither item is worth diamonds
        const profit = deal.amount2 - deal.amount1;
        return profit == 0 ? '---' : profit > 0 ? `+${profit.toString().padEnd(2, ' ')}📦` : `${profit.toString().padEnd(3, ' ')}📦`;
      }
    };

    for (let i = 0; i < 5; i++) {
      DailyDeal.generateDeals(5, dateToCheck);
      const description = ['```prolog'];
      const profit = ['```diff'];
      DailyDeal.list.forEach(deal => {
        description.push(`${deal.amount1.toString().padStart(2, ' ')} × ${deal.item1.name.toString().padEnd(padding, ' ')}  →  ${deal.amount2.toString().padStart(2, ' ')} × ${deal.item2.name}`);
        profit.push(calculateProfitString(deal));
      });
      description.push('```');
      profit.push('```');
      embed.addField('Profit', profit.join('\n'), true);
      embed.addField(`❯ ${dateToCheck.getFullYear()}-${(dateToCheck.getMonth() + 1).toString().padStart(2, 0)}-${dateToCheck.getDate().toString().padStart(2, 0)}`, description.join('\n'), true);
      embed.addField('\u200b', '\u200b', true); // To take up the third row
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }

    msg.channel.send({ embed });
  },
};
