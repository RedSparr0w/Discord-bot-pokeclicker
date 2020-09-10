const { MessageEmbed } = require('discord.js');
const { getAmount, removeAmount } = require('../database.js');
const { shopItems, postPages, SeededRand } = require('../helpers.js');
const { website } = require('../config.json');
const discordShopItems = [
  {
    name: '<@&751979566280605728> Role',
    image: '',
    price: 2500,
    description: 'Get the <@&751979566280605728> role on this Discord server',
    claimFunction: async (guild, member) => {
      const role = guild.roles.cache.find(role => role.name == 'Poké Squad');
      if (!role) return false;
      await member.roles.add(role);
      return true;
    },
  },
];
const allShopItems = [...shopItems, ...discordShopItems];

const generateCode = (discordID, code) => {
  discordID = +discordID;
  // reverse the string (for names that are similar - forms)
  const codeSeed = code.split('').reverse()
    // map to the character code
    .map(l => l.charCodeAt(0))
    // multiply the numbers (should be random enough)
    .reduce((s,b) => s * (b / 10), 1);

  SeededRand.seed(discordID + codeSeed);

  const arr = [];
  for (let i = 0; i < 14; i++) {
    let char;
    while (char == undefined || char.length != 1) {
      char = SeededRand.intBetween(0, 35).toString(36);
    }
    arr.push(char);
  }

  arr[4] = '-';
  arr[9] = '-';

  return arr.join('').toUpperCase();
};

module.exports = {
  name        : 'shop',
  aliases     : [],
  description : 'View stuff you can buy for your money',
  args        : ['page?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let [ page = 1 ] = args;

    if (isNaN(page) || page <= 0) page = 1;

    const balance = await getAmount(msg.author);

    const pages = [];

    allShopItems.forEach((item, index) => {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(msg.author)
        .addField('Name', item.name, true)
        .addField('Price', `${item.price} <:money:737206931759824918>`, true)
        .addField('Description', item.description)
        .setFooter(`Balance: ${balance.toLocaleString('en-US')} | Page: ${index + 1}/${allShopItems.length}`);

      if (item.image) embed.setThumbnail(website + item.image);

      pages.push({ embed });
    });

    const botMsg = await postPages(msg, pages, page);
    
    await botMsg.react('737206931759824918');
    const buyFilter = (reaction, user) => reaction.emoji.id === '737206931759824918' && user.id === msg.author.id;
  
    // Allow reactions for up to x ms
    const timer = 1e5; // (100 seconds)
    const buy = botMsg.createReactionCollector(buyFilter, {time: timer});

    buy.on('collect', async r => {
      botMsg.reactions.removeAll().catch(O_o=>{});
      const itemID = (botMsg.embeds[0].footer.text.match(/(\d+)\//) || [])[1];

      // Item doesn't exist or couldn't get item ID
      if (!itemID || !allShopItems[itemID - 1]) {
        const embed = new MessageEmbed()
          .setColor('#e74c3c')
          .setDescription([
            msg.author,
            'Failed to purchase item',
            'Something wen\'t wrong, try again later..',
          ]);
        return msg.channel.send({ embed });
      }

      const item = allShopItems[itemID - 1];
      const currentBalance = await getAmount(msg.author);

      // Create the embed now and edit as needed
      const embed = new MessageEmbed().setFooter(`Balance: ${currentBalance.toLocaleString('en-US')}`);
      if (item.image) embed.setThumbnail(website + item.image);

      // Item too expensive
      if (item.price > currentBalance) {
        embed.setColor('#e74c3c')
          .setDescription([
            msg.author,
            `**${item.name}** Failed to purhase!`,
            '',
            '_you cannot afford this item_',
          ]);

        return msg.channel.send({ embed });
      }

      // Purchase item
      if (item.claimFunction) { // Discord shop item
        const purchased = await item.claimFunction(msg.guild, msg.member);
        if (!purchased) {
          embed.setColor('#e74c3c')
            .setDescription([
              msg.author,
              'Failed to purchase item',
              'Something wen\'t wrong, try again later..',
            ]);
          return msg.channel.send({ embed });
        } else {
          const remainingBalance = await removeAmount(msg.author, item.price);
          embed.setColor('#2ecc71')
            .setDescription([
              msg.author,
              `**${item.name}** Successfully purchased!`,
            ])
            .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);
          return msg.channel.send({ embed });
        }
      } else { // Game shop item
        const remainingBalance = await removeAmount(msg.author, item.price);
        embed.setColor('#2ecc71')
          .setDescription([
            msg.author,
            `**${item.name}** Successfully purchased!`,
            '',
            '_code will be sent to you via direct message_',
          ])
          .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);

        msg.channel.send({ embed });

        embed.setDescription([
          `**${item.name}** Successfully purchased!`,
          '_Enter the following code in game to claim:_',
          '```',
          generateCode(msg.author.id, item.name),
          '```',
        ]);

        msg.author.send({ embed });
      }
    });
  },
};
