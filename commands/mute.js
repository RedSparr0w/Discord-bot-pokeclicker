const { MessageEmbed } = require('discord.js');
const { mutedRoleID } = require('../config.js');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { randomString, HOUR, WEEK, DAY, MINUTE, formatDateToString } = require('../helpers.js');
const { addScheduleItem } = require('../database.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'mute',
  aliases     : [],
  description : `Apply the <@&${mutedRoleID}> role to users`,
  args        : ['@users'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MUTE_MEMBERS'], // Voice mute permission
  execute     : async (msg, args) => {
    const embed = new MessageEmbed().setColor('#e74c3c');

    if (!msg.mentions.members.size) {
      embed.setDescription('No users mentioned..');
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [msg.author, '', 'Muted the following users:'];
    const users = [];

    for (const [, m] of [...msg.mentions.members]) {
      if (m == msg.guild.me) {
        const embed = new MessageEmbed().setColor('#e74c3c').setDescription('You cannot mute me trainer!');
        return msg.reply({ embeds: [embed] });
      }
      await m.roles.add(mutedRoleID, `User muted by ${msg.member.displayName}-${msg.author.id}`);
      output.push(m);
    }
    for (const [, u] of [...msg.mentions.users]) {
      users.push(u);
    }

    embed.setColor('#3498db').setDescription(output.join('\n'));
    const customID = randomString();
    const select = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId(`mute-time-${customID}`)
          .setPlaceholder('Mute user(s) for x time')
          .addOptions([
            {
              label: '1 Hour',
              description: 'Un-mute user(s) in 1 Hour',
              value: HOUR.toString(),
            },
            {
              label: '4 Hours',
              description: 'Un-mute user(s) in 4 Hours',
              value: (3 * HOUR).toString(),
            },
            {
              label: '12 Hours',
              description: 'Un-mute user(s) in 12 Hours',
              value: (12 * HOUR).toString(),
            },
            {
              label: '1 Day',
              description: 'Un-mute user(s) in 1 Day',
              value: DAY.toString(),
            },
            {
              label: '3 Days',
              description: 'Un-mute user(s) in 3 Days',
              value: (3 * DAY).toString(),
            },
            {
              label: '1 Week',
              description: 'Un-mute user(s) in 1 Week',
              value: WEEK.toString(),
            },
            {
              label: 'Manually',
              description: 'Un-mute user(s) manually',
              value: '0',
            },
          ])
      );

    // // Filters
    const filter = (i) => i.customId === `mute-time-${customID}` && i.user.id === msg.author.id;

    // Wait for up to x ms
    const timer = 3 * MINUTE;
    const selectedTime = msg.channel.createMessageComponentCollector({ filter, time: timer, max: 1 });
    let collected = false;

    selectedTime.on('collect', async i => {
      collected = true;
      await i.deferUpdate();
      const value = +i.values[0] || 0;
      if (value) {
        const date = Date.now() + value;
        embed.setDescription(`${output.join('\n')}\n\n_user(s) will be un-muted in ${formatDateToString(value)}_`);
        users.forEach(u => {
          addScheduleItem('un-mute', u, date, `${msg.guild.id}|${formatDateToString(+i.values[0])}`);
          modLog(msg.guild,
            `**Mod:** ${msg.author.toString()}
            **User:** ${u.toString()}
            **Action:** Muted
            **Duration:** _${formatDateToString(value)}_`);
        });
      }
      await i.editReply({ embeds: [embed], components: [] });
    });

    const botMsg = await msg.channel.send({ embeds: [embed], components: [select] });

    selectedTime.on('end', () => {
      if (!collected) {
        botMsg.edit({ components: [] }).catch(O_o=>{});
        users.forEach(u => {
          modLog(msg.guild,
            `**Mod:** ${msg.author.toString()}
            **User:** ${u.toString()}
            **Action:** Muted
            **Duration:** _Manual unmute_`);
        });
      }
    });
  },
};
