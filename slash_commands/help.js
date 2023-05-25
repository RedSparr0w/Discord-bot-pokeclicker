const { EmbedBuilder } = require('discord.js');
const {
  getAvailableChannelList,
  formatChannelList,
} = require('../helpers.js');

const getCommandSuggestion = (map, name) => {
  const cmd = map.find(c => c.name.toLowerCase() === name.toLowerCase()) || {id: 0, name};
  return `</${cmd.name}:${cmd.id}>`;
};

const formattedCommand = (map, command) => `❯ **${getCommandSuggestion(map, command.name)}**: ${command.description.split('\n')[0]}`;

module.exports = {
  name        : 'help',
  aliases     : ['commands'],
  description : 'List all of my commands or info about a specific command.',
  args        : [
    {
      name: 'command',
      type: 'STRING',
      description: 'Get help on a specific command',
      required: false,
    },
  ],
  guildOnly   : false,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  execute     : async (interaction) => {
    let command = interaction.options.get('command')?.value;
    let commands = interaction.client.slashCommands;
    if (interaction.channel.type === 'DM'){
      commands = commands.filter(command => !command.guildOnly);
    } else if (interaction.channel.type === 'GUILD_TEXT'){
      commands = commands.filter(command => !interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length);
    }

    const commandsMap = interaction.channel.type === 'DM' ?
      [...interaction.client.commands.cache].map(c => c[1]) :
      [...interaction.guild.commands.cache].map(c => c[1]);

    // Help on all commands
    if (!command) {
      const embed = new EmbedBuilder()
        .setTitle('Help')
        .setDescription([
          `For more detailed information about a command use ${getCommandSuggestion(commandsMap, 'help')}:`,
          '```css',
          '/help [command_name]',
          '```',
        ].join('\n'))
        .setColor('#3498db');

      if (interaction.channel.type === 'DM'){
        const description = commands.map(command => formattedCommand(commandsMap, command)).join('\n');
        embed.addField('__***Commands:***__', description);
      } else if (interaction.channel.type === 'GUILD_TEXT'){
        // Group the commands by their primary channel
        const restrictedCommands = [];
        const anyCommands = [];
        const groupedCommands = {};
        commands.filter(command => {
          // Check the user has the required permissions
          if (interaction.channel.type === 'GUILD_TEXT' && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
            return false;
          }

          // Check user has the required roles
          if (interaction.channel.type === 'GUILD_TEXT' && command.userroles?.length) {
            const hasRolePerms = command.userroles.some(r => interaction.member.roles.cache.find(role => role.id == r || role.name == r));
            if (!hasRolePerms) return false;
          }

          return true;
        }).forEach(command => {
          // Not restricted to any channels
          if (command.channels === undefined) {
            return anyCommands.push(formattedCommand(commandsMap, command));
          }
          // No channels allowed, restricted to specific hidden channels
          if (command.channels.length === 0) {
            return restrictedCommands.push(formattedCommand(commandsMap, command));
          }
          const allowedChannels = getAvailableChannelList(interaction.guild, command.channels);
          // No channels allowed, restricted from this server
          if (allowedChannels.size === 0) {
            return restrictedCommands.push(formattedCommand(commandsMap, command));
          }
          // Use the first channel name in the list
          const channelName = allowedChannels.first().name;
          if (groupedCommands[channelName] === undefined) groupedCommands[channelName] = [];
          groupedCommands[channelName].push(formattedCommand(commandsMap, command));
        });

        // Add the commands to the embed
        //
        // #anywhere
        // #channel-specific
        // #restricted
        if (anyCommands.length) embed.addField('__***#anywhere***__', anyCommands.join('\n'));
        Object.entries(groupedCommands).sort(([a], [b]) => `${a}`.localeCompare(`${b}`)).forEach(([channel, commands]) => {
          embed.addField(`__***#${channel}***__`, commands.join('\n'));
        });
        if (restrictedCommands.length) embed.addField('__***#restricted-channel***__', restrictedCommands.join('\n'));
      }
      return interaction.reply({ embeds: [embed] });
    }

    // Help on a specific command
    const name = command.toLowerCase();
    command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return interaction.reply('That is not a valid command!');
    }

    const embed = new EmbedBuilder()
      .setTitle(`Help | ${getCommandSuggestion(commandsMap, command.name)}`)
      .setColor('#3498db')
      .addField('❯ Description', `${command.description || '---'}`, false)
      .addField('❯ Usage', `\`\`\`css\n/${command.name}${command.args.map(arg=>` [${arg.name}${arg.required ? '' : '?'}]`).join('')}\`\`\``, false)
      .addField('❯ Cooldown', `\`${command.cooldown || 3} second(s)\``, true)
      .addField('❯ Guild Only', `\`${command.guildOnly}\``, true)
      .addField('❯ Channels', formatChannelList(interaction.guild, command.channels), true);

    if (command.helpFields) {
      embed.addField('\u200b\n═══ More Information ═══', '\u200b');
      command.helpFields.forEach(([header, body, inline]) => embed.addField(header, body, !!inline));
    }

    interaction.reply({ embeds: [embed] });
  },
};
