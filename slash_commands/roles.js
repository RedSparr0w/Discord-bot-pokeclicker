const { EmbedBuilder, MessageActionRow, MessageButton } = require('discord.js');
const { notificationRoles } = require('../config.js');
const { SECOND, MINUTE, randomString } = require('../helpers.js');

module.exports = {
  name        : 'roles',
  aliases     : ['role'],
  description : 'Get certain roles for updates and other stuff',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const user = interaction.user;
    const member = interaction.member;

    if (!notificationRoles) {
      return interaction.reply('No roles have been defined yet.');
    }

    const customID = randomString(6);

    const getButtons = () => {
      const buttons = new MessageActionRow();
      notificationRoles.forEach(role => {
        if (!member.guild.roles.cache.get(role.id)) return;
        buttons.addComponents(
          new MessageButton()
            .setCustomId(`${role.id}-role${customID}`)
            .setLabel(role.name)
            .setStyle(member.roles.cache.has(role.id) ? 'SUCCESS' : 'DANGER')
            .setEmoji((role.emoji?.match(/:(\d+)>/) ?? [role.emoji])[1])
        );
      });
      return buttons;
    };

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setDescription([user, 'Click the buttons to toggle the roles', ''].join('\n'));
    const buttons = getButtons();
    const components = buttons.components.length ? [buttons] : [];
    await interaction.reply({ embeds: [embed], components });

    const role_filter = (i) => i.customId.endsWith(`role${customID}`) && i.user.id === interaction.user.id;
  
    // Allow reactions for up to x ms
    const time = 2 * MINUTE;
    const role_reaction = interaction.channel.createMessageComponentCollector({ filter: role_filter, time });

    role_reaction.on('collect', async i => {
      await i.deferUpdate();

      // Update the users roles
      const roleID = i.customId.replace(/-\w+/, '');
      if (member.roles.cache.has(roleID)) {
        await member.roles.remove(roleID, 'Self removed role').catch(O_o=>{});
      } else {
        await member.roles.add(roleID, 'Self applied role').catch(O_o=>{});
      }
      await i.editReply({ components: [getButtons()] });

      // Update the bot message
      setTimeout(async () => {
        await i.editReply({ components: [getButtons()] });
      }, SECOND / 2);
    });

    // Clear all the reactions once we aren't listening
    role_reaction.on('end', () => interaction.editReply({ components: [] }).catch(O_o=>{}));
  },
};
