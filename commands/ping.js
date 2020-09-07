const { MessageEmbed } = require('discord.js');

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
    
    const embed = new MessageEmbed()
      .setDescription([
        '```yaml',
        'Pong: ---ms',
        '```',
      ])
      .setColor('#3498db');
    return msg.channel.send({ embed }).then(m=>{
      const outboundDelay = Date.now() - createdTime;
      embed.setDescription([
        '```yaml',
        `Pong: ${outboundDelay}ms`,
        '```',
      ]);
      m.edit({ embed });
    });
  },
};
