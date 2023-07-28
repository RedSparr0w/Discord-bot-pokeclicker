const { MessageEmbed } = require('discord.js');

const donatelink = 'https://ko-fi.com/pokeclicker';

module.exports = {
  name        : 'donate',
  aliases     : [],
  description : 'Get a Ko-Fi Donate link to help with the server cost of the Discord bot',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  execute     : async (interaction) => {
    const description = `<:heartscale:761861364876574740> Thank you for considering donating,
    The money will go towards the server cost of the Discord bot.

    [Ko-fi donate Link](${donatelink}):
    ${donatelink}`;

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(description);
    
    return interaction.reply({ embeds: [embed] });
  },
};
