const { MessageEmbed } = require('discord.js');
const {
  DailyDeal,
  UndergroundItem,
  dateToString,
} = require('../helpers.js');

module.exports = {
  name        : 'dailychain',
  aliases     : ['dc', 'dailychains', 'chain', 'chains'],
  description : 'Get a list of the best daily chains for the next 14 days',
  args        : ['max slots(3)?', 'from date(2020-12-01)?', 'days(14)?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let [maxSlots, fromDate, days] = args;

    if (isNaN(maxSlots) || maxSlots <= 0 || maxSlots > 5) {
      maxSlots = 3;
    } else {
      maxSlots = +maxSlots;
    }

    if (fromDate) {
      if (!/\d{4}-\d{2}-\d{2}/.test(fromDate)) return msg.reply(`Invalid from date specified: \`${fromDate}\`\nMust be \`YYYY-MM-DD\` format`);
      fromDate = fromDate.split('-');
      fromDate[1]--;
      fromDate = new Date(fromDate[0], fromDate[1], fromDate[2]);
    } else {
      const today = new Date();
      fromDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours() - 13);
    }

    if (isNaN(days) || days <= 0 || days > 100) {
      days = 14;
    } else {
      days;
    }

    const embed = new MessageEmbed()
      .setTitle(`Upcoming Daily Deals (${maxSlots} slots - ${days} days)`)
      //.setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${process.env.npm_package_version || '?.?.?'}`);

    // Calculate name padding
    const allItemsLength = UndergroundItem.list.map(item => item.name.length);
    const padding = Math.max(...allItemsLength);

    const itemsByValue = [...UndergroundItem.list].sort((a, b) => {
      const valueA = (a.value >= 100 || a.value <= 1) ? 0 : a.value;
      const valueB = (b.value >= 100 || b.value <= 1) ? 0 : b.value;
      return valueB - valueA;
    });
    const diamondItemsByValue = itemsByValue.filter(item => item.valueType == 'Diamond');
    const diamondItemNamesByValue = diamondItemsByValue.map(item => item.name);

    const calcProfit = (dealOne, dealTwo) => dealOne.amount2 * dealTwo.amount2 / dealOne.amount1 / dealTwo.amount1;

    const calcChainProfit = (deals) => {
      const first = deals[0];
      let second = deals[1];
      const buyin = first.item1.value;
      if (!second) {
        return (first.item2.value * first.amount2 / first.amount1) - buyin;
      }
      let amt = calcProfit(first, second);
      let i = 1;
      while (deals[++i]) {
        second = deals[i];
        amt *= second.amount2 / second.amount1;
      }
      return (amt * second.item2.value) - buyin;
    };

    class DealProfit {
      constructor(type, amount) {
        this.type = type;
        this.amount = amount;
      }
    }

    const calculateProfit = (deal) => {
      if (deal.item1.value >= 100 || deal.item1.value <= 1) deal.item1.value = 0;
      if (deal.item2.value >= 100 || deal.item2.value <= 1) deal.item2.value = 0;
      if (deal.item1.value || deal.item2.value) {
      // An item is worth diamonds
        const profit = (deal.item2.value * deal.amount2) - (deal.item1.value * deal.amount1);
        return new DealProfit('diamond', profit);
      } else {
      // Neither item is worth diamonds
        const profit = deal.amount2 - deal.amount1;
        return new DealProfit('item', profit);
      }
    };

    const getDealsList = (fromDate, totalDays = 14, maxDeals = 5) => {
      const dealsList = [];
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i);
        DailyDeal.generateDeals(maxDeals, date);
        dealsList.push([...DailyDeal.list].map(deal => {
          deal.profit = calculateProfit(deal);
          deal.date = date;
          return deal;
        }));
      }
      return dealsList;
    };

    const dailyDeals = getDealsList(fromDate, days, maxSlots);

    const possibleTradesGive = {};
    const possibleTradesGet = {};
    [...dailyDeals].reverse().forEach(deals => {
      deals.forEach(deal => {
        if (!possibleTradesGive[deal.item1.name]) possibleTradesGive[deal.item1.name] = [];
        possibleTradesGive[deal.item1.name].push(deal);
        if (!possibleTradesGet[deal.item2.name]) possibleTradesGet[deal.item2.name] = [];
        possibleTradesGet[deal.item2.name].push(deal);
      });
    });

    const chainList = [];

    const createDealsChain = (itemName, date, currentChain = []) => {
      if (possibleTradesGet[itemName]) {
        const nextDeals = possibleTradesGet[itemName].filter(nDeal => nDeal.date <= date);
        if (nextDeals.length) {
          nextDeals.forEach(deal => {
            createDealsChain(deal.item1.name, deal.date, [deal, ...currentChain]);
          });
        } else {
          chainList.push(currentChain);
        }
      } else {
        chainList.push(currentChain);
      }
    };

    diamondItemNamesByValue.forEach(item => {
      if (!possibleTradesGet[item]) return;
      possibleTradesGet[item].forEach(deal => {
        if (deal.profit.amount > 0) createDealsChain(deal.item1.name, deal.date, [deal]);
      });
    });

    let tooLong = false;
    chainList.filter(i => i.length > 0 && calcChainProfit(i) > 0).sort((a, b) => calcChainProfit(b) - calcChainProfit(a)).slice(0, 20).forEach((deals, index) => {
      if (tooLong) return;
      let description = [];
      description.push(`Profit per 1 of initial investment \`💎 ${+calcChainProfit(deals).toFixed(1)}\``);
      description.push('```ini');
      deals.forEach((deal, i) => {
        description.push(`[${dateToString(deal.date)}] [${deal.amount1}] ${deal.item1.name.padEnd(padding, ' ')} → [${deal.amount2}] ${deal.item2.name}`);
      });
      description.push('```');
      const title = `❯ ${dateToString(deals[0].date)} → ${dateToString(deals[deals.length - 1].date)}`;
      description = description.join('\n');
      if (embed.length + title.length + description.length >= 6000) {
        return tooLong = true;
      }
      embed.addField(title, description);
    });


    msg.channel.send({ embed });
  },
};
