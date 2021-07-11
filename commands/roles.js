const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { notificationRoles } = require('../config.js');
const { SECOND, MINUTE } = require('../helpers.js');

module.exports = {
  type        : 'interaction',
  name        : 'roles',
  aliases     : ['role'],
  description : 'Get certain roles for updates and other stuff',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const user = interaction.user;
    const member = interaction.member;

    if (!notificationRoles) {
      return interaction.reply('No roles have been defined yet.');
    }

    const customID = Math.random().toString(36).substring(8);

    const getButtons = () => {
      const buttons = new MessageActionRow();
      notificationRoles.forEach(role => {
        if (!member.guild.roles.cache.get(role.id)) return;
        buttons.addComponents(
          new MessageButton()
            .setCustomId(`${role.id}-role${customID}`)
            .setLabel(role.name)
            .setStyle(member.roles.cache.has(role.id) ? 'SUCCESS' : 'DANGER')
            .setEmoji((role.emoji.match(/:(\d+)>/) || [])[1])
        );
      });
      return buttons;
    };

    const embed = new MessageEmbed()
      .setColor('#3498db')
      .setDescription([user, 'Click the buttons to toggle the roles', ''].join('\n'));
    
    await interaction.reply({ embeds: [embed], components: [getButtons()] });

    const role_filter = (i) => i.customId.endsWith(`role${customID}`) && i.user.id === interaction.user.id;
  
    // Allow reactions for up to x ms
    const time = 2 * MINUTE;
    const role_reaction = interaction.channel.createMessageComponentCollector({ filter: role_filter, time });

    role_reaction.on('collect', async i => {
      // Remove the users reaction
      await i.deferUpdate();
      await i.editReply({ components: [getButtons()] });

      // Update the users roles
      const roleID = i.customId.replace(/-\w+/, '');
      if (member.roles.cache.has(roleID)) {
        await member.roles.remove(roleID, 'Self removed role').catch(O_o=>{});
      } else {
        await member.roles.add(roleID, 'Self applied role').catch(O_o=>{});
      }

      // Update the bot message
      setTimeout(async () => {
        await i.editReply({ components: [getButtons()] });
      }, SECOND / 2);
    });

    // Clear all the reactions once we aren't listening
    role_reaction.on('end', () => interaction.update({ components: [] }).catch(O_o=>{}));
  },
};
