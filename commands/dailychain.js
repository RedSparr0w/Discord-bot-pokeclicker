const { MessageEmbed } = require('discord.js');
const {
  DailyDeal,
  UndergroundItem,
  dateToString,
  gameVersion,
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

    if (isNaN(days) || days <= 0) {
      days = 14;
    } else {
      // speed is no longer an issue,
      // but we are limited by message length limits
      days = Math.min(1000, days);
    }

    const embed = new MessageEmbed()
      .setTitle(`Upcoming Daily Deals (${maxSlots} slots - ${days} days)`)
      //.setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`);

    // Calculate name padding
    const allItemsLength = UndergroundItem.list.map(item => item.name.length);
    const padding = Math.max(...allItemsLength);

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

    const dailyDeals = getDealsList(fromDate, days, maxSlots).flatMap(deals =>
      // when processing deals, we want to make sure all possible links
      // have been processed. Sometimes, there is a deal on the same day
      // which we can link to, so we sort the deals within each day to
      // make sure those linkables have been processed
      deals.sort((a, b) => {
        // if `b` can link to `a`, `a` should sort after `b` (and vice versa)
        if (a.item1 == b.item2) return 1;
        if (b.item1 == a.item2) return -1;

        // if `a` can be linked from something sort `a` after `b`
        if (deals.find(x => a.item1 == x.item2)) return 1;
        // if `b` can be linked from something, sort `a` before `b`
        if (deals.find(x => b.item1 == x.item2)) return -1;

        return 0;
      })
    );

    const chainList = [];
    let worstProfitInList = 0;
    const maxChains = 20;

    const addChain = (start) => {
      const profit = start.profit - start.deal.item1.value;
      if (profit > worstProfitInList) {
        const chain = [];
        let link = start;

        while (link != undefined) {
          chain.push(link.deal);
          link = chains.list[link.next];
        }

        chainList.push({profit: profit, deals: chain});
        chainList.sort((a,b) => (b.profit - a.profit));
        if (chainList.length > maxChains) {
          chainList.pop();
          worstProfitInList = chainList[chainList.length - 1].profit;
        }
      }
    };

    const betterToSell = (deal, next) => {
      // If we would be better off selling item1 of this deal,
      // then we shouldn't suggest feeding it into the chain
      const newChainValue = next.profit * deal.amount2 / deal.amount1;
      const potentialProfit = newChainValue - deal.item1.value;

      // If we wouldn't get diamonds from selling item1, we only stand to gain
      const notDia = deal.amount1 >= 100 || deal.amount1 < 0;

      return (!notDia && potentialProfit <= 0);
    };

    const chains = dailyDeals.reduceRight((res,deal) => {
      // Link to the best future deal
      let next = res.bestStartingWith[deal.item2.name];

      // Don't link to a bad chain
      if (next != undefined && betterToSell(deal, next)) {
        next = undefined;
      }

      const chainlink = {deal: deal, next: next, linkedFrom: []};
      const index = res.list.length;

      // Calculate chain value from this deal
      if (next != undefined) {
        const nextlink = res.list[next];
        nextlink.linkedFrom.push(index);
        chainlink.profit = nextlink.profit * deal.amount2 / deal.amount1;
      } else {
        const val = (deal.item2.value > 100 || deal.item2.value < 0) ? 0 : deal.item2.value;
        chainlink.profit = val * deal.amount2 / deal.amount1;
      }

      // update bestStartingWith
      const bestItem1 = res.list[res.bestStartingWith[deal.item1.name]];
      if (chainlink.profit > 0 && (!bestItem1 || bestItem1.profit < chainlink.profit)) {
        res.bestStartingWith[deal.item1.name] = index;
      }

      res.list.push(chainlink);
      return res;
    }, { bestStartingWith: {}, list: [] });

    // build chainList
    // only add chains using the start, ie those that aren't linkedFrom anything
    chains.list.forEach(link => link.linkedFrom.length || addChain(link));

    let tooLong = false;
    chainList.forEach(chain => {
      if (tooLong) return;
      // Our data
      const deals = chain.deals;
      const profit = +chain.profit.toFixed(1);
      // Initial field
      const title = `❯ ${dateToString(deals[0].date)} → ${dateToString(deals[deals.length - 1].date)}`;
      const description = `Profit per 1 of initial investment \`💎 ${profit.toLocaleString('en-US')}\``;
      // Output
      let dates = [];
      let deal_output1 = [];
      let deal_output2 = [];
      dates.push('```ini');
      deal_output1.push('```ini');
      deal_output2.push('```ini');
      deals.forEach(deal => {
        dates.push(`[${dateToString(deal.date)}]`);
        deal_output1.push(`[${deal.amount1}] ${deal.item1.name.padEnd(padding, ' ')}`);
        deal_output2.push(`[${deal.amount2}] ${deal.item2.name}`);
      });
      dates.push('```');
      deal_output1.push('```');
      deal_output2.push('```');
      dates = dates.join('\n');
      deal_output1 = deal_output1.join('\n');
      deal_output2 = deal_output2.join('\n');
      
      if (deal_output1.length > 1024) {
        deal_output1 = `${deal_output1.substr(0, 1000).replace(/\r?\n.+$/, '')}\n...chain too long...\n\`\`\``;
        deal_output2 = `${deal_output2.split('\n').slice(0,deal_output1.split('\n').length - 2).join('\n')}\n...chain too long...\n\`\`\``;
        dates = `${dates.split('\n').slice(0,deal_output1.split('\n').length - 1).join('\n')}\n\`\`\``;
      }
      if (embed.length + title.length + deal_output1.length + deal_output2.length + dates.length >= 5950) {
        return tooLong = true;
      }
      embed.addField(title, description);
      embed.addField('Date', dates, true);
      embed.addField('Give', deal_output1, true);
      embed.addField('Receive', deal_output2, true);
    });


    msg.channel.send({ embed });
  },
};
