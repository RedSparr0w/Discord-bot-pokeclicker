const postPages = async (msg, pages, page = 1, msgEdit = false) => {
  // page number should be 1 lower than expected for array
  page = Math.max(1, Math.min(pages.length, page)) - 1;

  // Send the default page
  const botMsg = await msg.channel.send(msgEdit ? 'Loading...' : pages[page]);
  if (msgEdit) await botMsg.edit(pages[page]);

  // Don't add the reactions if only 1 page
  if (pages.length <= 1) return;

  // Add reactions
  await botMsg.react('⬅');
  await botMsg.react('➡');

  // Filters
  const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && user.id === msg.author.id;
  const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && user.id === msg.author.id;

  // Allow reactions for up to x ms
  const timer = 2e5; // (200 seconds)
  const backwards = botMsg.createReactionCollector(backwardsFilter, {time: timer});
  const forwards = botMsg.createReactionCollector(forwardsFilter, {time: timer});

  backwards.on('collect', r => {
    page = page <= 0 ? 0 : --page;
    r.users.remove(msg.author.id).catch(O_o=>{});
    botMsg.edit(pages[page]);
  });

  forwards.on('collect', r => {
    page = page >= pages.length - 1 ? pages.length - 1 : ++page;
    r.users.remove(msg.author.id).catch(O_o=>{});
    botMsg.edit(pages[page]);
  });

  // Clear all the reactions once we aren't listening
  backwards.on('end', () => botMsg.reactions.removeAll().catch(O_o=>{}));

  return botMsg;
};

const upperCaseFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];

module.exports = {
  postPages,
  upperCaseFirstLetter,
  randomFromArray,
};
