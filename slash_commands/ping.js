const { MessageEmbed } = require('discord.js');

module.exports = {
  type        : 'interaction',
  name        : 'ping',
  aliases     : [],
  description : 'Check that I\'m still responding',
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
