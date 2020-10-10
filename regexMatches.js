module.exports = [
  // Auto react to comments if 2+ lines start with an emoji
  {
    regex: {
      test: (content) =>{
        const emoji_regex = /^((?:<:.+?:)\d+|[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
        const lines = content.split(/\r?\n/).map(line=>line.trim());
        const answers = lines.filter(line=>emoji_regex.test(line));
        return answers.length >= 2;
      },
    },
    execute: (message, client) => {
      const emoji_regex = /^((?:<:.+?:)\d+|[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
      const lines = message.content.split(/\r?\n/).map(line=>line.trim());
      const answers = lines.filter(line=>emoji_regex.test(line));
      const addReaction = (reaction, cb) =>{
        setTimeout(async () => {
          await message.react(reaction).catch(O_o=>{});
          cb();
        }, 100);
      };

      const reactions = answers.map(answer=>answer.match(emoji_regex)[1]);
      reactions.reduce((promiseChain, reaction) => promiseChain.then(() => new Promise((resolve) => {
        addReaction(reaction, resolve);
      })), Promise.resolve());
    },
  },
  // soon™
  {
    regex: /\b(when)\b.+\b(release|version|update)\b/i,
    execute: (message, client) => {
      message.channel.send('soon™');
    },
  },
  // FAQ
  {
    regex: /\b(how|where)\b.+\b(catch|find|get|evolve|buy)\b/i,
    execute: (message, client) => {
      let text = '';
      const faq = message.guild.channels.cache.find(channel => channel.name == 'faq');
      if (faq) text += `\nYou might be able to find the answer you are looking for in the ${faq}.`;

      const botCommands = message.guild.channels.cache.find(channel => channel.name == 'bot-commands');
      if (botCommands) text += `\nThere may be a command available in ${botCommands}.`;

      if (text.length) message.reply(text);
    },
  },
];
