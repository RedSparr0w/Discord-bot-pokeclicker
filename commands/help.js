const { EmbedBuilder } = require('discord.js');
const {
  upperCaseFirstLetter,
  getAvailableChannelList,
  formatChannelList,
} = require('../helpers.js');
const { prefix } = require('../config.js');

module.exports = {
  name        : 'help',
  aliases     : ['h'],
  description : 'List all of my commands or info about a specific command.',
  args        : ['command_name?'],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let commands = msg.client.commands;
    if (msg.channel.type === 'DM'){
      commands = commands.filter(command => !command.guildOnly);
    } else if (msg.channel.type === 'GUILD_TEXT'){
      commands = commands.filter(command => !msg.channel.permissionsFor(msg.member).missing(command.userperms).length);
    }

    // Help on all commands
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setTitle('Help')
        .setDescription([
          'For more detailed information about a command use',
          '```css',
          `${prefix}help [command_name]`,
          '```',
        ].join('\n'))
        .setColor('#3498db');

      if (msg.channel.type === 'DM'){
        const description = commands.map(command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`).join('\n');
        embed.addFields({
          name: '__***Commands:***__',
          value: description,
        });
      } else if (msg.channel.type === 'GUILD_TEXT'){
        // Group the commands by their primary channel
        const restrictedCommands = [];
        const anyCommands = [];
        const groupedCommands = {};
        commands.forEach(command => {
          // Not restricted to any channels
          if (command.channels === undefined) {
            return anyCommands.push(formattedCommand(command));
          }
          // No channels allowed, restricted to specific hidden channels
          if (command.channels.length === 0) {
            return restrictedCommands.push(formattedCommand(command));
          }
          const allowedChannels = getAvailableChannelList(msg.guild, command.channels);
          // No channels allowed, restricted from this server
          if (allowedChannels.size === 0) {
            return restrictedCommands.push(formattedCommand(command));
          }
          // Use the first channel name in the list
          const channelName = allowedChannels.first().name;
          if (groupedCommands[channelName] === undefined) groupedCommands[channelName] = [];
          groupedCommands[channelName].push(formattedCommand(command));
        });

        // Add the commands to the embed
        //
        // #anywhere
        // #channel-specific
        // #restricted
        if (anyCommands.length) embed.addFields({
          name: '__***#anywhere***__',
          value: anyCommands.join('\n'),
        });
        Object.entries(groupedCommands).sort(([a], [b]) => `${a}`.localeCompare(`${b}`)).forEach(([channel, commands]) => {
          embed.addFields({
            name: `__***#${channel}***__`,
            value: commands.join('\n'),
          });
        });
        if (restrictedCommands.length) embed.addFields({
          name: '__***#restricted-channel***__',
          value: restrictedCommands.join('\n'),
        });
      }
      return msg.channel.send({ embeds: [embed] });
    }

    // Help on a specific command
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return msg.channel.send({ content: 'That is not a valid command!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Help | ${upperCaseFirstLetter(command.name)}`)
      .setColor('#3498db')
      .addFields([
        {
          name: '❯ Description',
          value: `${command.description}`,
        },
        {
          name: '❯ Usage',
          value: `\`\`\`css\n${prefix}${command.name}${command.args.map(arg=>` [${arg}]`).join('')}\`\`\``,
        },
        {
          name: '❯ Aliases',
          value: `\`${command.aliases.join('`, `') || '-'}\``,
          inline: true,
        },
        {
          name: '❯ Cooldown',
          value: `\`${command.cooldown || 3} second(s)\``,
          inline: true,
        },
        {
          name: '❯ Guild Only',
          value: `\`${command.guildOnly}\``,
          inline: true,
        },
        {
          name: '❯ Channels',
          value: formatChannelList(msg.guild, command.channels),
          inline: true,
        },
      ]);

    if (command.helpFields) {
      embed.addFields({
        name: '\u200b\n═══ More Information ═══',
        value: '\u200b',
      });
      command.helpFields.forEach(([header, body, inline]) => embed.addFields({
        name: header,
        value: body,
        inline: !!inline,
      }));
    }

    msg.channel.send({ embeds: [embed] });
  },
};

const formattedCommand = command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`;
