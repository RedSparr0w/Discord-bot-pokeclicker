const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.js');
const {
  log,
  info,
  warn,
  error,
  gameVersion,
  RunOnInterval,
  formatChannelList,
  trainerCardBadgeTypes,
  HOUR,
} = require('./helpers.js');
const {
  setupDB,
  backupDB,
  addPurchased,
  addStatistic,
} = require('./database.js');
const regexMatches = require('./regexMatches.js');
const { newQuiz } = require('./other/quiz/quiz.js');
const { happyHourHours, startHappyHour, endHappyHour } = require('./other/quiz/happy_hour.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

const cooldownTimeLeft = (type, seconds, userID) => {
  // Apply command cooldowns
  if (!cooldowns.has(type)) {
    cooldowns.set(type, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(type);
  const cooldownAmount = (seconds || 3) * 1000;

  if (timestamps.has(userID)) {
    const expirationTime = timestamps.get(userID) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    }
  }

  timestamps.set(userID, now);
  setTimeout(() => timestamps.delete(userID), cooldownAmount);
  return 0;
};

client.once('ready', async() => {
  info(`Logged in as ${client.user.tag}!`);
  log(`Invite Link: https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot`);
  // Check the database is setup
  await setupDB();

  new RunOnInterval(HOUR, () => {
    // Set our status
    client.user.setActivity(`PokéClicker v${gameVersion}`);
  }, { run_now: true });

  new RunOnInterval(6 * HOUR, () => {
    client.guilds.cache.forEach(guild => backupDB(guild));
  }, { timezone_offset: 0 });

  // Start happy hour
  new RunOnInterval(happyHourHours * HOUR, () => {
    client.guilds.cache.forEach(guild => startHappyHour(guild));
  }, { timezone_offset: 0 });

  // End happy hour 1 hour later
  new RunOnInterval(happyHourHours * HOUR, () => {
    client.guilds.cache.forEach(guild => endHappyHour(guild));
  }, { timezone_offset: HOUR });
  
  // Will restart itself
  client.guilds.cache.forEach(guild => newQuiz(guild, true));
});

client.on('error', e => error('Client error thrown:', e))
  .on('warn', warning => warn(warning))
  .on('message', async message => {
    // Either not a command or a bot, ignore
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) {
      const timeLeft = cooldownTimeLeft('messages', 30, message.author.id);
      if (!timeLeft) {
        const messagesSent = await addStatistic(message.author, 'messages');
        if (messagesSent >= 2500) {
          await addPurchased(message.author, 'badge', trainerCardBadgeTypes.Thunder);
        }
      }

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
      // Direct Message
      message.channel.type === 'dm' ||
      // User can manage the guild, and can use bot commands anywhere
      message.channel.permissionsFor(message.member).missing(['MANAGE_GUILD']).length === 0 ||
      // Command was run in `#****-bot`
      message.channel.name.endsWith('-bot') ||
      // Command is allowed in this channel
      (!command.channels || command.channels.includes(message.channel.name))
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
    const timeLeft = cooldownTimeLeft(command.name, command.cooldown, message.author.id);
    if (timeLeft > 0) {
      return message.reply(`Please wait ${Math.ceil(timeLeft * 10) / 10} more second(s) before reusing the \`${command.name}\` command.`);
    }

    // Run the command
    try {
      // Send the message object, along with the arguments, and the commandName (incase an alias was used)
      await command.execute(message, args, commandName);
      addStatistic(message.author, `!${command.name}`);
      const commandsSent = await addStatistic(message.author, 'commands');
      if (commandsSent >= 1000) {
        await addPurchased(message.author, 'badge', trainerCardBadgeTypes.Cascade);
      }
    } catch (err) {
      error(`Error executing command "${message.content}":\n`, err);
      message.reply('There was an error trying to execute that command!');
    }
  });

client.login(token);
