const { MessageEmbed } = require('discord.js');
const {
  upperCaseFirstLetter,
  getAvailableChannelList,
  formatChannelList,
} = require('../helpers.js');
const { prefix } = require('../config.js');

module.exports = {
  name        : 'help',
  aliases     : ['commands', 'h'],
  description : 'List all of my commands or info about a specific command.',
  args        : ['command_name?'],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let commands = msg.client.commands;
    if (msg.channel.type === 'dm'){
      commands = commands.filter(command => !command.guildOnly);
    } else if (msg.channel.type === 'text'){
      commands = commands.filter(command => !msg.channel.permissionsFor(msg.member).missing(command.userperms).length);
    }

    // Help on all commands
    if (!args.length) {
      const embed = new MessageEmbed()
        .setTitle('Help')
        .setDescription([
          'For more detailed information about a command use',
          '```css',
          `${prefix}help [command_name]`,
          '```',
        ])
        .setColor('#3498db');

      if (msg.channel.type === 'dm'){
        const description = commands.map(command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`).join('\n');
        embed.addField('__***Commands:***__', description);
      } else if (msg.channel.type === 'text'){
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
        if (anyCommands.length) embed.addField('__***#anywhere***__', anyCommands);
        Object.entries(groupedCommands).sort(([a], [b]) => `${a}`.localeCompare(`${b}`)).forEach(([channel, commands]) => {
          embed.addField(`__***#${channel}***__`, commands);
        });
        if (restrictedCommands.length) embed.addField('__***#restricted-channel***__', restrictedCommands);
      }
      return msg.channel.send({ embeds: [embed] });
    }

    // Help on a specific command
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return msg.channel.send('That is not a valid command!');
    }

    const embed = new MessageEmbed()
      .setTitle(`Help | ${upperCaseFirstLetter(command.name)}`)
      .setColor('#3498db')
      .addField('❯ Description', `${command.description}`)
      .addField('❯ Usage', `\`\`\`css\n${prefix}${command.name}${command.args.map(arg=>` [${arg}]`).join('')}\`\`\``)
      .addField('❯ Aliases', `\`${command.aliases.join('`, `') || '-'}\``, true)
      .addField('❯ Cooldown', `\`${command.cooldown || 3} second(s)\``, true)
      .addField('❯ Guild Only', `\`${command.guildOnly}\``, true)
      .addField('❯ Channels', formatChannelList(msg.guild, command.channels), true);

    if (command.helpFields) {
      embed.addField('\u200b\n═══ More Information ═══', '\u200b');
      command.helpFields.forEach(([header, body, inline]) => embed.addField(header, body, !!inline));
    }

    msg.channel.send({ embeds: [embed] });
  },
};

const formattedCommand = command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`;
