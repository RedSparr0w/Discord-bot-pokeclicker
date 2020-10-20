const { Collection, MessageEmbed } = require('discord.js');
const {
  upperCaseFirstLetter,
  getAvailableChannelList,
  formatChannelList,
} = require('../helpers.js');
const { prefix } = require('../config.json');

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
      commands = commands.filter(command => !msg.channel.memberPermissions(msg.member).missing(command.userperms).length);
    }

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

      commands
        // Group the commands by their primary channel
        .reduce((acc, next) => {
          const allowedChannels = getAvailableChannelList(msg.guild, next.channels);
          let currChannel = 'Any';
          // If this command is restricted to a channel, use the first channel
          if (allowedChannels !== true) {
            currChannel = allowedChannels.size === 0
              ? 'Restricted'
              : allowedChannels.first().name;
          }

          if (!acc.has(currChannel)) acc.set(currChannel, []);
          acc.get(currChannel).push(next);
          return acc;
        }, new Collection())
        .forEach((channelCommands, rawChannelName) => {
          const channel = msg.guild.channels.cache.find((v) => v.name === rawChannelName) || rawChannelName;
          const channelDescription = channelCommands.reduce((acc, command) => acc.concat(
            `❯ **${upperCaseFirstLetter(command.name)}**: ${command.description.split('\n')[0]}`
          ), []);
          embed.addField(
            channel.name ? `#${channel.name}` : `${channel} channel`,
            channelDescription,
            false
          );
        });
      return msg.channel.send({ embed });
    }

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

    msg.channel.send({ embed });
  },
};
