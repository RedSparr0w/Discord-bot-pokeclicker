const { MessageEmbed } = require('discord.js');
const { addPurchased } = require('../database.js');
const { trainerCardBadges } = require('../helpers.js');

module.exports = {
  name        : 'give-badge',
  aliases     : ['givebadge'],
  description : 'Give badge to specified user',
  args        : ['badge icon', '@user'],
  guildOnly   : true,
  cooldown    : 1,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    const badgeIcon = args.find(arg=>new RegExp(trainerCardBadges.map(b=>b.icon).join('|')).test(arg));
    const badgeIndex = trainerCardBadges.findIndex(b=>b.icon == badgeIcon);
    const badge = trainerCardBadges[badgeIndex];
    
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!badge) {
      embed.setDescription('Invalid badge icon specified..');
      return msg.channel.send({ embeds: [embed] });
    }
    if (!msg.mentions.users.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [msg.author, `Gave ${badge.icon} ${badge.name} Badge to the following users`, ''];

    for (const [, user] of [...msg.mentions.users]) {
      await addPurchased(user, 'badge', badgeIndex);
      output.push(`${user}`);
    }

    embed.setColor('#2ecc71')
      .setDescription(output);

    msg.channel.send({ embeds: [embed] });
  },
};
