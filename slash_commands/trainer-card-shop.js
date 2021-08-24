const { MessageEmbed, MessageButton } = require('discord.js');
const { getAmount, removeAmount, getPurchased, addPurchased, setTrainerCard } = require('../database.js');
const {
  upperCaseFirstLetter,
  postPages,
  trainerCardColors,
  totalTrainerImages,
  trainerCardBadgeTypes,
  randomString,
  error,
} = require('../helpers.js');
const { serverIcons } = require('../config.js');
const imageBaseLink = 'https://raw.githubusercontent.com/RedSparr0w/Discord-bot-pokeclicker/master/assets/images';

module.exports = {
  name        : 'trainer-card-shop',
  aliases     : ['trainercardshop', 'tcshop', 'profileshop'],
  description : 'View stuff you can buy with your PokéCoins for your trainer card',
  args        : [
    {
      name: 'page',
      type: 'INTEGER',
      description: 'Which start page',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    let page = +(interaction.options.get('page')?.value || 1);

    if (isNaN(page) || page <= 0) page = 1;

    const balance = await getAmount(interaction.user);
    const purchasedBackgrounds = await getPurchased(interaction.user, 'background');
    const purchasedTrainers = await getPurchased(interaction.user, 'trainer');

    let pages = [];

    trainerCardColors.forEach((color, index) => {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(interaction.user.toString())
        .addField('Color', upperCaseFirstLetter(color), true)
        .addField('Price', `${purchasedBackgrounds[index] ? '0' : '1000'} ${serverIcons.money}`, true)
        .addField('Description', 'Update your trainer card background')
        .setThumbnail(`${imageBaseLink}/trainer_card/${color}.png`);

      pages.push({ embeds: [embed] });
    });

    for (let trainerID = 0; trainerID <= totalTrainerImages; trainerID++) {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(interaction.user.toString())
        .addField('Trainer ID', `#${trainerID.toString().padStart(3, 0)}`, true)
        .addField('Price', `${purchasedTrainers[trainerID] ? '0' : '500'} ${serverIcons.money}`, true)
        .addField('Description', 'Set your displayed trainer')
        .setThumbnail(`${imageBaseLink}/trainers/${trainerID}.png`);

      pages.push({ embeds: [embed] });
    }

    pages = pages.map((page, index) => {
      page.embeds[0].setFooter(`Balance: ${balance.toLocaleString('en-US')} | Page: ${index + 1}/${pages.length}`);
      return page;
    });

    const buttons = await postPages(interaction, pages, page);
    
    const customID = randomString(6);

    buttons.addComponents(
      new MessageButton()
        .setCustomId(`purchase${customID}`)
        .setLabel('Purchase')
        .setStyle('PRIMARY')
        .setEmoji('751765172523106377')
    );

    interaction.editReply({ components: [buttons] });
    const buyFilter = (i) => i.customId === `purchase${customID}` && i.user.id === interaction.user.id;
  
    // Allow reactions for up to x ms
    const timer = 2e5; // (200 seconds)
    const buy = interaction.channel.createMessageComponentCollector({ filter: buyFilter, time: timer });

    buy.on('collect', async i => {
      await i.deferUpdate();
      await i.editReply({ components: [] });

      const currentBalance = await getAmount(interaction.user);

      try {
        const message = await interaction.fetchReply();
        const price = parseInt(message.embeds[0].fields.find(f => f.name == 'Price').value);
        const pageNumber = (message.embeds[0].footer.text.match(/(\d+)\//) || [])[1];
        // TODO: Update this if we add more item types in the future
        const itemType = message.embeds[0].fields.find(f => f.name == 'Color') ? 'background' : 'trainer';
        const itemIndex = pageNumber <= trainerCardColors.length ? pageNumber - 1 : (pageNumber - trainerCardColors.length) - 1;

        // Initial embed object, with red color
        const embed = new MessageEmbed().setColor('#e74c3c');

        // Couldn't read the price correctly
        if (isNaN(price)) throw new Error('Price is NaN');

        // Item too expensive
        if (price > currentBalance) {
          embed.setDescription([
            interaction.user,
            'Failed to purchase!',
            '',
            '_you cannot afford this item_',
          ].join('\n'));

          return interaction.followUp({ embeds: [embed] });
        }

        // Item purchased
        let remainingBalance;
        if (price > 0) {
          await addPurchased(interaction.user, itemType, itemIndex);
          remainingBalance = await removeAmount(interaction.user, price);
        } else {
          remainingBalance = currentBalance;
        }

        // If user updated their profile, give them the Boulder Badge
        await addPurchased(interaction.user, 'badge', trainerCardBadgeTypes.Boulder);

        await setTrainerCard(interaction.user, itemType, itemIndex);

        embed.setColor('#2ecc71')
          .setDescription([
            interaction.user,
            'Successfully purchased!',
            '',
            `New ${itemType} has been set!`,
          ].join('\n'))
          .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);
        return interaction.followUp({ embeds: [embed] });
      } catch (e) {
        error('Failed to purchase item', e);
        const embed = new MessageEmbed()
          .setColor('#e74c3c')
          .setDescription([
            interaction.user,
            'Failed to purchase item',
            '',
            'Something wen\'t wrong, try again later..',
          ].join('\n'));

        return interaction.followUp({ embeds: [embed] });
      }
    });
  },
};
