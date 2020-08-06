module.exports = {
  name        : 'ping',
  aliases     : [],
  description : 'Check that i\'m still responding',
  args        : [],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const createdTime = Date.now();
    return msg.channel.send([
      '```yaml',
      'Pong: ---ms',
      '```',
    ]).then(m=>{
      const outboundDelay = Date.now() - createdTime;
      m.edit([
        '```yaml',
        `Pong: ${outboundDelay}ms`,
        '```',
      ]);
    });
  },
};
