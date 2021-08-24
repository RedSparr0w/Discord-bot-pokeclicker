const { MessageEmbed } = require('discord.js');
const {
  upperCaseFirstLetter,
  getAvailableChannelList,
  formatChannelList,
} = require('../helpers.js');

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

    // Help on all commands
    if (!command) {
      const embed = new MessageEmbed()
        .setTitle('Help')
        .setDescription([
          'For more detailed information about a command use:',
          '```css',
          '/help [command_name]',
          '```',
        ].join('\n'))
        .setColor('#3498db');

      if (interaction.channel.type === 'DM'){
        const description = commands.map(command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`).join('\n');
        embed.addField('__***Commands:***__', description);
      } else if (interaction.channel.type === 'GUILD_TEXT'){
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
          const allowedChannels = getAvailableChannelList(interaction.guild, command.channels);
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

    const embed = new MessageEmbed()
      .setTitle(`Help | ${upperCaseFirstLetter(command.name)}`)
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

const formattedCommand = command => `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`;
