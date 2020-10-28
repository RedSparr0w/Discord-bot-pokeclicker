const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const {
  log,
  info,
  warn,
  error,
  gameVersion,
  RunOnInterval,
  formatChannelList,
} = require('./helpers.js');
const {
  setupDB,
  backupDB,
} = require('./database.js');
const regexMatches = require('./regexMatches.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

client.once('ready', async() => {
  info(`Logged in as ${client.user.tag}!`);
  log(`Invite Link: https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot`);
  // Check the database is setup
  await setupDB();

  new RunOnInterval(60 * 6e4 /* 1 Hour */, () => {
    // Set our status
    client.user.setActivity(`PokéClicker v${gameVersion}`);
  }, { run_now: true });

  new RunOnInterval(6 * 60 * 6e4 /* 6 Hours */, () => {
    client.guilds.cache.forEach(guild => backupDB(guild));
  }, { timezone_offset: 0 });
});

client.on('error', e => error('Client error thrown:', e))
  .on('warn', warning => warn(warning))
  .on('message', message => {
    // Either not a command or a bot, ignore
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) {
      try {
        const match = regexMatches.find(match => match.regex.test(message.content));
        if (match) match.execute(message, client);
      } catch (err) {
        error('Regex Match Error:\n', err);
      }
      return;
    }

    // Each argument should be split by 1 (or more) space character
    const args = message.content.slice(prefix.length).trim().split(/,?\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
      || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // Not a valid command
    if (!command) return;

    // Check if command needs to be executed inside a guild channel
    if (command.guildOnly && message.channel.type !== 'text') {
      return message.channel.send('I can\'t execute that command inside DMs!');
    }

    // Check the user has the required permissions
    if (message.channel.type === 'text' && message.channel.permissionsFor(message.member).missing(command.userperms).length) {
      return message.reply('You do not have the required permissions to run this command.');
    }

    // Check the bot has the required permissions
    if (message.channel.type === 'text' && message.channel.permissionsFor(message.guild.me).missing(command.botperms).length) {
      return message.reply('I do not have the required permissions to run this command.');
    }

    const commandAllowedHere = (
      (message.channel.type === 'text' && (
        // User can manage the guild, and can use bot commands anywhere
        message.channel.permissionsFor(message.member).missing(['MANAGE_GUILD']).length === 0 ||
        // Command was run in `#****-bot`
        message.channel.name.endsWith('-bot') ||
        // Command is allowed in this channel
        (!command.channels || command.channels.includes(message.channel.name))
      ))
    );

    if (!commandAllowedHere) {
      const output = [`This is not the correct channel for \`${prefix}${command.name}\`.`];
      if (command.channels && command.channels.length !== 0) {
        output.push(`Please try again in ${formatChannelList(message.guild, command.channels)}.`);
      }
      message.delete().catch((e) => error('Unable to delete message:', e));
      return message.reply(output);
    }

    // Check the user has supplied enough arguments for the command
    if (command.args.filter(arg=>!arg.endsWith('?')).length > args.length) {
      return message.channel.send([
        'You didn\'t provide enough command arguments!',
        `The proper usage would be: \`${prefix}${command.name}${command.args.map(arg => ` [${arg}]`).join('')}\``,
      ]);
    }

    // Apply command cooldowns
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Please wait ${Math.ceil(timeLeft * 10) / 10} more second(s) before reusing the \`${command.name}\` command.`);
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Run the command
    try {
      // Send the message object, along with the arguments, and the commandName (incase an alias was used)
      command.execute(message, args, commandName);
    } catch (err) {
      error('Error executing command:', err);
      message.reply('There was an error trying to execute that command!');
    }
  });

client.login(token);
