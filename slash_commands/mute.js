const { MessageEmbed } = require('discord.js');
const { mutedRoleID } = require('../config.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { randomString, HOUR, WEEK, DAY, MINUTE, formatDateToString } = require('../helpers.js');
const { addScheduleItem } = require('../database.js');

module.exports = {
  type        : 'USER',
  name        : 'mute',
  aliases     : [],
  description : 'Apply the @Muted role to users',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'User to mute',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MUTE_MEMBERS'], // Voice mute permission
  execute     : async (interaction, args) => {
    const id = interaction.options.get('user').value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    const user = member.user;

    if (member == interaction.guild.me) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('You cannot mute me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const output = [interaction.user, '', 'Muted the following user:'];

    await member.roles.add(mutedRoleID, `User muted by ${interaction.member.displayName}-${interaction.user.id}`);
    output.push(member);

    const embed = new MessageEmbed().setColor('#3498db').setDescription(output.join('\n'));
    const customID = randomString();
    const select = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId(`mute-time-${customID}`)
          .setPlaceholder('Mute user for x time')
          .addOptions([
            {
              label: '1 Hour',
              description: 'Un-mute user in 1 Hour',
              value: HOUR.toString(),
            },
            {
              label: '4 Hours',
              description: 'Un-mute user in 4 Hours',
              value: (3 * HOUR).toString(),
            },
            {
              label: '12 Hours',
              description: 'Un-mute user in 12 Hours',
              value: (12 * HOUR).toString(),
            },
            {
              label: '1 Day',
              description: 'Un-mute user in 1 Day',
              value: DAY.toString(),
            },
            {
              label: '3 Days',
              description: 'Un-mute user in 3 Days',
              value: (3 * DAY).toString(),
            },
            {
              label: '1 Week',
              description: 'Un-mute user in 1 Week',
              value: WEEK.toString(),
            },
            {
              label: 'Manually',
              description: 'Un-mute user manually',
              value: '0',
            },
          ])
      );

    // // Filters
    const filter = (i) => i.customId === `mute-time-${customID}` && i.user.id === user.id;

    // Wait for up to x ms
    const timer = 3 * MINUTE;
    const selectedTime = interaction.channel.createMessageComponentCollector({filter, time: timer});

    selectedTime.on('collect', async i => {
      await i.deferUpdate();
      const value = +i.values[0] || 0;
      if (value) {
        const date = Date.now() + value;
        embed.setDescription(`${output.join('\n')}\n\n_user will be un-muted in ${formatDateToString(+i.values[0])}_`);
        addScheduleItem('un-mute', user, date, `${interaction.guild.id}|${formatDateToString(+i.values[0])}`);
      }
      await i.editReply({ embeds: [embed], components: [] });
    });
    selectedTime.on('end', () => interaction.editReply({ components: [] }).catch(O_o=>{}));

    interaction.reply({ embeds: [embed], components: [select] });
  },
};
