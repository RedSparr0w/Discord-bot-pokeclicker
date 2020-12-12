const { MessageEmbed } = require('discord.js');
const { notificationRoles } = require('../config.js');
const { addOrderedReactions, SECOND, MINUTE } = require('../helpers.js');

module.exports = {
  name        : 'roles',
  aliases     : ['role'],
  description : 'Get certain roles for updates and other stuff',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (msg, args) => {
    const user = msg.author;
    const member = msg.member;

    if (!notificationRoles) {
      return msg.channel.send('No roles have been defined yet.');
    }

    const getDescription = () => {
      const description = [user, 'Click the reactions to toggle the roles', ''];
      Object.keys(notificationRoles).forEach(roleID => {
        description.push(`${notificationRoles[roleID]} <@&${roleID}>: ${member.roles.cache.has(roleID) ? 'enabled' : 'disabled'}`);
      });
      return description;
    };

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription(getDescription());
    
    const bot_message = await msg.channel.send({ embed });

    const reactionIDs = Object.values(notificationRoles).map(r => (r.match(/:(\d+)>/) || [])[1]);

    await addOrderedReactions(bot_message, [...reactionIDs, '🔄']);
    const role_filter = (reaction, u) => reactionIDs.includes(reaction.emoji.id) && u.id === user.id;
    
    const refresh_filter = (reaction, user) => reaction.emoji.name === '🔄' && user.id === msg.author.id;
  
    // Allow reactions for up to x ms
    const time = 2 * MINUTE;
    const role_reaction = bot_message.createReactionCollector(role_filter, { time });

    role_reaction.on('collect', async r => {
      // Remove the users reaction
      r.users.remove(user.id).catch(O_o=>{});

      // Update the users roles
      const role_index = reactionIDs.findIndex(reactionID => reactionID === r.emoji.id);
      const roleID = Object.keys(notificationRoles)[role_index];
      if (member.roles.cache.has(roleID)) {
        await member.roles.remove(roleID, 'Self removed role');
      } else {
        await member.roles.add(roleID, 'Self applied role');
      }

      // Update the bot message
      setTimeout(() => {
        const embed = bot_message.embeds[0];
        embed.setDescription(getDescription());
        bot_message.edit({ embed }).catch(O_o=>{});
      }, SECOND / 2);
    });

    const refresh_reaction = bot_message.createReactionCollector(refresh_filter, { time });
    refresh_reaction.on('collect', async r => {
      // Remove the users reaction
      r.users.remove(user.id).catch(O_o=>{});

      // Update the bot message
      setTimeout(() => {
        const embed = bot_message.embeds[0];
        embed.setDescription(getDescription());
        bot_message.edit({ embed }).catch(O_o=>{});
      }, SECOND / 2);
    });

    // Clear all the reactions once we aren't listening
    role_reaction.on('end', () => bot_message.reactions.removeAll().catch(O_o=>{}));
  },
};
