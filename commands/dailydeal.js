const { MessageEmbed } = require('discord.js');
const {
  DailyDeal,
  UndergroundItem,
  dateToString,
  gameVersion,
} = require('../helpers.js');

module.exports = {
  name        : 'dailydeal',
  aliases     : ['dd', 'deals', 'dailydeals', 'ug', 'underground'],
  description : 'Get a list of daily deals for the next 5 days',
  args        : ['from date(2020-12-31)?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let [date] = args;
    if (date) {
      if (!/\d{4}-\d{2}-\d{2}/.test(date)) return msg.reply(`Invalid date specified: \`${date}\`\nMust be \`YYYY-MM-DD\` format`);
      date = date.split('-');
      date[1]--;
    }

    const embed = new MessageEmbed()
      .setTitle('Upcoming Daily Deals')
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`);

    // Calculate name padding
    const allItemsLength = UndergroundItem.list.map(item => item.name.length);
    const padding = Math.max(...allItemsLength);

    let dateToCheck;
    if (date) {
      dateToCheck = new Date(date[0], date[1], date[2]);
    } else {
      const today = new Date();
      dateToCheck = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours() - 13);
    }

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
      embed.addField(`❯ ${dateToString(dateToCheck)}`, description.join('\n'), true);
      embed.addField('Profit', profit.join('\n'), true);
      embed.addField('\u200b', '\u200b', true); // To take up the third row
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }

    msg.channel.send({ embed });
  },
};
