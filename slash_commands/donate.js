const { MessageEmbed } = require('discord.js');

const donatelink = 'https://www.paypal.com/donate?hosted_button_id=AYMCC237K8VR4';

module.exports = {
  name        : 'donate',
  aliases     : [],
  description : 'Get a PayPal Donate link to help with the server cost of the Discord bot',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  execute     : async (interaction) => {
    const description = `<:heartscale:761861364876574740> Thank you for considering donating,
    The money will go towards the server cost of the Discord bot.

    [PayPal Donate Link](${donatelink}):
    ${donatelink}`;

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(description);
    
    return interaction.reply({ embeds: [embed] });
  },
};
