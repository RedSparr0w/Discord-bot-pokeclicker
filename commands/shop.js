const { MessageEmbed, MessageButton } = require('discord.js');
const { getAmount, removeAmount } = require('../database.js');
const { shopItems, postPages, SeededRand } = require('../helpers.js');
const { website, serverIcons } = require('../config.js');
const discordShopItems = [
  {
    name: '<@&751979566280605728> Role',
    image: '',
    price: 2500,
    description: 'Get the <@&751979566280605728> role on this Discord server\n_+20% to claim bonuses_',
    claimFunction: async (guild, member) => {
      const role = guild.roles.cache.find(role => role.name == 'Poké Squad');
      if (!role) return false;
      await member.roles.add(role, 'User purchased role');
      return true;
    },
  },
  {
    name: '<@&824467607981129781> Role',
    image: '',
    price: 100000,
    description: 'Get the <@&824467607981129781> role on this Discord server\n_no bonuses just a new colored name_',
    claimFunction: async (guild, member) => {
      const role = guild.roles.cache.find(role => role.name == '100k club');
      if (!role) return false;
      await member.roles.add(role, 'User purchased role');
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
  type        : 'interaction',
  name        : 'shop',
  aliases     : [],
  description : 'View stuff you can buy for your money',
  args        : ['page?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    let page = interaction.options.get('page')?.value || 1;

    if (isNaN(page) || page <= 0) page = 1;

    const balance = await getAmount(interaction.user);

    const pages = [];

    allShopItems.forEach((item, index) => {
      const embed = new MessageEmbed()
        .setColor('#3498db')
        .setDescription(interaction.user.toString())
        .addField('Name', item.name, true)
        .addField('Price', `${item.price.toLocaleString('en-US')} ${serverIcons.money}`, true)
        .addField('Description', item.description)
        .setFooter(`Balance: ${balance.toLocaleString('en-US')} | Page: ${index + 1}/${allShopItems.length}`);

      if (item.image) embed.setThumbnail(website + item.image);

      pages.push({ embeds: [embed] });
    });

    const buttons = await postPages(interaction, pages, page);
    
    const customID = Math.random().toString(36).substring(2, 8);

    buttons.addComponents(
      new MessageButton()
        .setCustomId(`purchase${customID}`)
        .setLabel('purchase')
        .setStyle('SECONDARY')
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
      const message = await interaction.fetchReply();
      const itemID = (message.embeds[0].footer.text.match(/(\d+)\//) || [])[1];

      // Item doesn't exist or couldn't get item ID
      if (!itemID || !allShopItems[itemID - 1]) {
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

      const item = allShopItems[itemID - 1];
      const currentBalance = await getAmount(interaction.user);

      // Create the embed now and edit as needed
      const embed = new MessageEmbed().setFooter(`Balance: ${currentBalance.toLocaleString('en-US')}`);
      if (item.image) embed.setThumbnail(website + item.image);

      // Item too expensive
      if (item.price > currentBalance) {
        embed.setColor('#e74c3c')
          .setDescription([
            interaction.user,
            `**${item.name}** Failed to purchase!`,
            '',
            '_you cannot afford this item_',
          ].join('\n'));

        return interaction.followUp({ embeds: [embed] });
      }

      // Purchase item
      if (item.claimFunction) { // Discord shop item
        const purchased = await item.claimFunction(interaction.member.guild, interaction.member);
        if (!purchased) {
          embed.setColor('#e74c3c')
            .setDescription([
              interaction.user,
              'Failed to purchase item',
              '',
              'Something wen\'t wrong, try again later..',
            ].join('\n'));
          return interaction.followUp({ embeds: [embed] });
        } else {
          const remainingBalance = await removeAmount(interaction.user, item.price);
          embed.setColor('#2ecc71')
            .setDescription([
              interaction.user,
              `**${item.name}** Successfully purchased!`,
            ].join('\n'))
            .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);
          return interaction.followUp({ embeds: [embed] });
        }
      } else { // Game shop item

        embed.setDescription([
          `**${item.name}** Successfully purchased!`,
          '_Enter the following code in game to claim:_',
          '```',
          generateCode(interaction.user.id, item.name),
          '```',
          '',
          '**NOTE:**',
          '_You will need to link your Discord account in game before the code will work_',
          '`Start Menu` → `Save` → `Link Discord`',
        ].join('\n'));

        let error;
        await interaction.user.send({ embeds: [embed] }).catch(e => error = e);
        // Error sending the code to the user, DM's might be disabled
        if (error) {
          embed.setColor('#e74c3c')
            .setDescription([
              interaction.user,
              'Failed to purchase item',
              '',
              '_make sure you are able to receive direct messages_',
            ].join('\n'));
          return interaction.followUp({ embeds: [embed] });
        }

        const remainingBalance = await removeAmount(interaction.user, item.price);

        embed.setColor('#2ecc71')
          .setDescription([
            interaction.user,
            `**${item.name}** Successfully purchased!`,
            '',
            '_code will be sent to you via direct message_',
          ].join('\n'))
          .setFooter(`Balance: ${remainingBalance.toLocaleString('en-US')}`);

        interaction.followUp({ embeds: [embed] });
      }
    });
  },
};
