const { MessageEmbed } = require('discord.js');
const { upperCaseFirstLetter } = require('../helpers.js');
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

      commands.forEach(command => embed.addField(`❯ ${upperCaseFirstLetter(command.name)}`, [`${command.description.split('\n')[0]}`], true));
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
      .addField('❯ Guild Only', `\`${command.guildOnly}\``, true);

    if (command.helpFields) {
      embed.addField('\u200b\n═══ More Information ═══', '\u200b');
      command.helpFields.forEach(([header, body, inline]) => embed.addField(header, body, !!inline));
    }

    msg.channel.send({ embed });
  },
};
