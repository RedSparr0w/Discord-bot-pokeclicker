const { MessageEmbed } = require('discord.js');
const { getAmount, removeAmount, getPurchased, addPurchased, setTrainerCard } = require('../database.js');
const { upperCaseFirstLetter, postPages, trainerCardColors, totalTrainerImages } = require('../helpers.js');
const imageBaseLink = 'https://raw.githubusercontent.com/RedSparr0w/Discord-bot-pokeclicker/master/assets/images';

module.exports = {
  name        : 'profileshop',
  aliases     : ['trainercardshop', 'tcshop'],
  description : 'View stuff you can buy for your money',
  args        : ['page?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (msg, args) => {
    let [ page = 1 ] = args;

    if (isNaN(page) || page <= 0) page = 1;

    const balance = await getAmount(msg.author);
    const purchasedBackgrounds = await getPurchased(msg.author, 'background');
    const purchasedTrainers = await getPurchased(msg.author, 'trainer');

    let pages = [];

    trainerCardColors.forEach((color, index) => {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(msg.author)
        .addField('Color', upperCaseFirstLetter(color), true)
        .addField('Price', purchasedBackgrounds[index] ? '0 <:money:737206931759824918>' : '1000 <:money:737206931759824918>', true)
        .addField('Description', 'Update your trainer card background')
        .setThumbnail(`${imageBaseLink}/trainer_card/${color}.png`);

      pages.push({ embed });
    });

    for (let trainerID = 0; trainerID <= totalTrainerImages; trainerID++) {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(msg.author)
        .addField('Trainer ID', `#${trainerID.toString().padStart(3, 0)}`, true)
        .addField('Price', purchasedTrainers[trainerID] ? '0 <:money:737206931759824918>' : '500 <:money:737206931759824918>', true)
        .addField('Description', 'Set your displayed trainer')
        .setThumbnail(`${imageBaseLink}/trainers/${trainerID}.png`);

      pages.push({ embed });
    }

    pages = pages.map((page, index) => {
      page.embed.setFooter(`Balance: ${balance.toLocaleString('en-US')} | Page: ${index + 1}/${pages.length}`);
      return page;
    });

    const botMsg = await postPages(msg, pages, page);
    
    await botMsg.react('737206931759824918');
    const buyFilter = (reaction, user) => reaction.emoji.id === '737206931759824918' && user.id === msg.author.id;
  
    // Allow reactions for up to x ms
    const timer = 1e5; // (100 seconds)
    const buy = botMsg.createReactionCollector(buyFilter, {time: timer});

    buy.on('collect', async r => {
      botMsg.reactions.removeAll().catch(O_o=>{});
      const currentBalance = await getAmount(msg.author);

      try {
        const price = parseInt(botMsg.embeds[0].fields.find(f => f.name == 'Price').value);
        const pageNumber = (botMsg.embeds[0].footer.text.match(/(\d+)\//) || [])[1];
        // TODO: Update this if we add more item types in the future
        const itemType = botMsg.embeds[0].fields.find(f => f.name == 'Color') ? 'background' : 'trainer';
        const itemIndex = pageNumber <= trainerCardColors.length ? pageNumber - 1 : (pageNumber - trainerCardColors.length) - 1;

        // Initial embed object, with red color
        const embed = new MessageEmbed().setColor('#e74c3c');

        // Couldn't read the price correctly
        if (isNaN(price)) throw new Error('Price is NaN');

        // Item too expensive
        if (price > currentBalance) {
          embed.setDescription([
            msg.author,
            'Failed to purchase!',
            '',
            '_you cannot afford this item_',
          ]);

          return msg.channel.send({ embed });
        }

        // Item purchased
        let remainingBalance;
        if (price > 0) {
          await addPurchased(msg.author, itemType, itemIndex);
          remainingBalance = await removeAmount(msg.author, price);
        } else {
          remainingBalance = currentBalance;
        }

        // If user updated their profile, give them the Boulder Badge
        await addPurchased(msg.author, 'badge', 0);

        await setTrainerCard(msg.author, itemType, itemIndex);

        embed.setColor('#2ecc71')
          .setDescription([
            msg.author,
            'Successfully purchased!',
            '',
            `New ${itemType} has been set!`,
          ])
          .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);
        return msg.channel.send({ embed });
      } catch (e) {
        const embed = new MessageEmbed()
          .setColor('#e74c3c')
          .setDescription([
            msg.author,
            'Failed to purchase item',
            '',
            'Something wen\'t wrong, try again later..',
          ]);

        return msg.channel.send({ embed });
      }
    });
  },
};
