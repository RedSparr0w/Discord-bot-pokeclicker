const { MessageActionRow, MessageButton } = require('discord.js');

const postPages = async (interaction, pages, page = 1, msgEdit = false) => {
  // page number should be 1 lower than expected for array
  page = Math.max(1, Math.min(pages.length, page)) - 1;
  const customID = Math.random().toString(36).substring(8);

  // Send the default page
  await interaction.reply(msgEdit ? 'Loading...' : pages[page]);
  if (msgEdit) await interaction.editReply(pages[page]);

  const buttons = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(`prev${customID}`)
        .setLabel('prev')
        .setStyle('SECONDARY')
        .setEmoji('⬅'),
      new MessageButton()
        .setCustomId(`next${customID}`)
        .setLabel('next')
        .setStyle('SECONDARY')
        .setEmoji('➡')
    );

  interaction.editReply({ components: [buttons] });

  // Don't add the reactions if only 1 page
  if (pages.length <= 1) return;

  // // Filters
  const backwardsFilter = (i) => i.customId === `prev${customID}` && i.user.id === interaction.user.id;
  const forwardsFilter = (i) => i.customId === `next${customID}` && i.user.id === interaction.user.id;

  // Allow reactions for up to x ms
  const timer = 2e5; // (200 seconds)
  const backwards = interaction.channel.createMessageComponentCollector({filter: backwardsFilter, time: timer});
  const forwards = interaction.channel.createMessageComponentCollector({filter: forwardsFilter, time: timer});

  backwards.on('collect', async i => {
    page = page <= 0 ? 0 : --page;
    await i.deferUpdate();
    await i.editReply(pages[page]);
  });

  forwards.on('collect', async i => {
    page = page >= pages.length - 1 ? pages.length - 1 : ++page;
    await i.deferUpdate();
    await i.editReply(pages[page]);
  });

  // Clear all the reactions once we aren't listening
  backwards.on('end', () => interaction.update({ components: [] }).catch(O_o=>{}));

  return interaction;
};

const upperCaseFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];

const addOrderedReactions = async (message, reactions) => {
  const addReaction = (reaction, cb) =>{
    setTimeout(async () => {
      await message.react(reaction).catch(O_o=>{});
      cb();
    }, 100);
  };

  reactions.reduce((promiseChain, reaction) => promiseChain.then(() => new Promise((resolve) => {
    addReaction(reaction, resolve);
  })), Promise.resolve());
};

module.exports = {
  postPages,
  upperCaseFirstLetter,
  randomFromArray,
  addOrderedReactions,
};
