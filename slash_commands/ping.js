const { EmbedBuilder } = require('discord.js');

module.exports = {
  name        : 'ping',
  aliases     : [],
  description : 'Replies with the bots current ping to Discord',
  args        : [],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  execute     : async (interaction) => {
    const createdTime = Date.now();
    
    const embed = new EmbedBuilder()
      .setDescription([
        '```yaml',
        'Pong: --ms',
        'API: ---ms',
        '```',
      ].join('\n'))
      .setColor('#3498db');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    const outboundDelay = Date.now() - createdTime;
    const APIDelay = Math.round(interaction.client.ws.ping);
    embed.setDescription([
      '```yaml',
      `Pong: ${outboundDelay}ms`,
      `API: ${APIDelay}ms`,
      '```',
    ].join('\n'));
    
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
