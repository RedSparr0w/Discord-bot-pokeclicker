const { MessageEmbed } = require('discord.js');

module.exports = {
  name        : 'ping',
  aliases     : [],
  description : 'Replies with the bots current ping to Discord',
  args        : [],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (interaction) => {
    const createdTime = Date.now();
    
    const embed = new MessageEmbed()
      .setDescription([
        '```yaml',
        'Pong: ---ms',
        '```',
      ].join('\n'))
      .setColor('#3498db');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    const outboundDelay = Date.now() - createdTime;
    embed.setDescription([
      '```yaml',
      `Pong: ${outboundDelay}ms`,
      '```',
    ].join('\n'));
    
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
