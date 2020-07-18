const { MessageEmbed } = require('discord.js');
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
    const data = [];
    let commands = msg.client.commands;
    if (msg.channel.type === 'dm'){
      commands = commands.filter(command => !command.guildOnly);
    } else if (msg.channel.type === 'text'){
      commands = commands.filter(command => !msg.channel.memberPermissions(msg.member).missing(command.userperms).length);
    }

    if (!args.length) {
      commands.forEach(command => data.push(`${prefix}${command.name}${command.args.map(arg=>` [${arg}]`).join('')}: ${command.description}`));
      return msg.channel.send(data, { code: 'http', split: true });
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return msg.channel.send('That is not a valid command!');
    }

    const embed = new MessageEmbed()
      .setTitle(`***\`${prefix}help ${command.name}\`***`)
      .setColor('#3498db')
      .addField('❯ Description', `\`${command.description}\``)
      .addField('❯ Usage', `\`\`\`css\n${prefix}${command.name}${command.args.map(arg=>` [${arg}]`).join('')}\`\`\``)
      .addField('❯ Aliases', `\`${command.aliases.join('`, `') || '-'}\``, true)
      .addField('❯ Cooldown', `\`${command.cooldown || 3} second(s)\``, true)
      .addField('❯ Guild Only', `\`${command.guildOnly}\``, true);
    msg.channel.send({ embed });
  },
};
