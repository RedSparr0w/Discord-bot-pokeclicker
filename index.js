const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token, mutedRoleID } = require('./config.js');
const {
  log,
  info,
  warn,
  error,
  gameVersion,
  RunOnInterval,
  formatChannelList,
  trainerCardBadgeTypes,
  MINUTE,
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
const { sendReminders } = require('./other/reminder/reminder.js');
const { happyHourHours, startHappyHour, endHappyHour } = require('./other/quiz/happy_hour.js');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_EMOJIS,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
});
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

  // Check for and send any reminders every minute
  new RunOnInterval(MINUTE, () => {
    sendReminders(client);
  }, { timezone_offset: 0, run_now: true });

  // Update our status every hour
  new RunOnInterval(HOUR, () => {
    // Set our status
    client.user.setActivity(`PokéClicker v${gameVersion}`);
  }, { run_now: true });

  // Backup the database every 6 hours
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
  
  // Quiz will restart itself, only needs to be run once
  client.guilds.cache.forEach(guild => newQuiz(guild, true));
});

client.on('error', e => error('Client error thrown:', e))
  .on('warn', warning => warn(warning))
  .on('messageCreate', async message => {
    // Either not a command or a bot, ignore
    if (message.author.bot) return;

    // Mute users who mass ping (3 or more users)
    if (message.mentions.users.size >= 3) {
      message.delete().catch(e=>{});
      message.member.roles.add(mutedRoleID, 'User muted for mass ping');
      return message.reply('You have been muted, Do not mass ping!');
    }

    
    if (!client.application || !client.application.owner) await client.application.fetch();

    if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application.owner.id) {
      const data = [
        {
          name: 'ping',
          description: 'Replies with Pong!',
        },
        {
          name: 'allstatistics',
          description: 'Replies with your input!',
          options: [
            {
              name: 'type',
              type: 'STRING',
              description: 'The input to echo back',
              required: false,
            },
          ],
        },
      ];

      const command = await client.guilds.cache.get('611852340752023552').commands.set(data);
      console.log(command);
    }

    // Non command messages
    if (!message.content.startsWith(prefix)) {
      // Add points for each message sent (every 30 seconds)
      const timeLeft = cooldownTimeLeft('messages', 30, message.author.id);
      if (!timeLeft) {
        const messagesSent = await addStatistic(message.author, 'messages');
        if (messagesSent >= 2500) {
          await addPurchased(message.author, 'badge', trainerCardBadgeTypes.Thunder);
        }
      }

      // Auto replies etc
      try {
        const match = regexMatches.find(match => match.regex.test(message.content));
        if (match) match.execute(message, client);
      } catch (err) {
        error('Regex Match Error:\n', err);
      }

      // We don't want to process anything else now
      return;
    }
  })
  .on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log('int:\n', interaction, '\n/int');

    const command = client.commands.get(interaction.commandName)
      || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));

    // // Each argument should be split by 1 (or more) space character
    // const args = message.content.slice(prefix.length).trim().split(/,?\s+/);
    // const commandName = args.shift().toLowerCase();

    // Not a valid command
    if (!command) return;

    // // Check if command needs to be executed inside a guild channel
    // if (command.guildOnly && message.channel.type !== 'text') {
    //   return message.channel.send('I can\'t execute that command inside DMs!');
    // }

    // // Check the user has the required permissions
    // if (message.channel.type === 'text' && message.channel.permissionsFor(message.member).missing(command.userperms).length) {
    //   return message.reply('You do not have the required permissions to run this command.');
    // }

    // // Check the bot has the required permissions
    // if (message.channel.type === 'text' && message.channel.permissionsFor(message.guild.me).missing(command.botperms).length) {
    //   return message.reply('I do not have the required permissions to run this command.');
    // }

    // const commandAllowedHere = (
    //   // Direct Message
    //   message.channel.type === 'dm' ||
    //   // User can manage the guild, and can use bot commands anywhere
    //   message.channel.permissionsFor(message.member).missing(['MANAGE_GUILD']).length === 0 ||
    //   // Command was run in `#****-bot`
    //   message.channel.name.endsWith('-bot') ||
    //   // Command is allowed in this channel
    //   (!command.channels || command.channels.includes(message.channel.name))
    // );

    // if (!commandAllowedHere) {
    //   const output = [`This is not the correct channel for \`${prefix}${command.name}\`.`];
    //   if (command.channels && command.channels.length !== 0) {
    //     output.push(`Please try again in ${formatChannelList(message.guild, command.channels)}.`);
    //   }
    //   message.delete().catch((e) => error('Unable to delete message:', e));
    //   return message.reply(output);
    // }

    // // Check the user has supplied enough arguments for the command
    // if (command.args.filter(arg=>!arg.endsWith('?')).length > args.length) {
    //   return message.channel.send([
    //     'You didn\'t provide enough command arguments!',
    //     `The proper usage would be: \`${prefix}${command.name}${command.args.map(arg => ` [${arg}]`).join('')}\``,
    //   ]);
    // }

    // Apply command cooldowns
    const timeLeft = cooldownTimeLeft(command.name, command.cooldown, interaction.user.id);
    if (timeLeft > 0) {
      return interaction.reply({ content: `Please wait ${Math.ceil(timeLeft * 10) / 10} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
    }

    // Run the command
    try {
      // Send the message object, along with the arguments, and the commandName (incase an alias was used)
      await command.execute(interaction);
      addStatistic(interaction.user, `!${command.name}`);
      const commandsSent = await addStatistic(interaction.user, 'commands');
      if (commandsSent >= 1000) {
        await addPurchased(interaction.user, 'badge', trainerCardBadgeTypes.Cascade);
      }
    } catch (err) {
      error(`Error executing command "${command.name}":\n`, err);
      interaction.reply('There was an error trying to execute that command!');
    }
  });

client.login(token);
