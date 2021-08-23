const { MessageEmbed } = require('discord.js');

module.exports = {
  name        : 'ping',
  aliases     : [],
  description : 'Check that I\'m still responding',
  args        : [],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const embed = new MessageEmbed()
      .setDescription([
        '```yaml',
        'Pong: ---ms',
        '```',
      ].join('\n'))
      .setColor('#3498db');

    const createdTime = Date.now();
    await msg.reply({ embeds: [embed], ephemeral: true }).then(m => {
      const outboundDelay = Date.now() - createdTime;
      embed.setDescription([
        '```yaml',
        `Pong: ${outboundDelay}ms`,
        '```',
      ].join('\n'));
      
      m.edit({ embeds: [embed], ephemeral: true });
    });
  },
};
