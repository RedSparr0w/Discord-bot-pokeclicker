const { error } = require('../helpers.js');
const { ownerID } = require('../config.json');
const clean = text => {
  if (typeof(text) === 'string')
    return text.replace(/`/g, `\`${String.fromCharCode(8203)}`).replace(/@/g, `@${String.fromCharCode(8203)}`);
  else
    return text;
};

module.exports = {
  name        : 'eval',
  aliases     : [],
  description : 'Eval code',
  args        : ['code'],
  guildOnly   : true,
  cooldown    : 0.1,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [], // `dev-bot` is automatically allowed
  execute     : async (msg, args) => {
    if (!ownerID || msg.author.id !== ownerID) return;
    try {
      let script = (msg.content.match(/```js\r?\n(.+|\r?\n)+\r?\n```$/) || [''])[0];
      script = script ? script.substr(6, script.length - 10) : args.join(' ');
      let evaled = await eval(`async() => {${script}}`)();
      if (typeof evaled !== 'string')
        evaled = require('util').inspect(evaled);
      msg.channel.send(clean(evaled).substr(0, 1980), { code: 'prolog' });
    } catch (err) {
      error('Eval error:', err);
      msg.channel.send(`\`EVAL ERROR\` \`\`\`prolog\n${clean(err)}\n\`\`\``);
    }
  },
};
