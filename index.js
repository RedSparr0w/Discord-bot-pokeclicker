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
          description: 'Replies with the bots current ping to Discord',
        },
        {
          name: 'badges',
          description: 'Check what badges can be earned for your trainer card',
        },
        {
          name: 'balance',
          description: 'Get your current PokéCoin balance',
        },
        {
          name: 'berry',
          description: 'Get PokéClicker game info about a specific Berry',
          options: [
            {
              name: 'berryname',
              type: 'STRING',
              description: 'Which berry you want info on (can be an ID or name)',
              required: true,
            },
          ],
        },
        {
          name: 'claim',
          description: 'Claim your daily PokéCoins',
        },
        {
          name: 'daily-chain',
          description: 'Get a list of the best daily chains for the next 14 days',
          options: [
            {
              name: 'max-slots',
              type: 'INTEGER',
              description: 'Maximum number of slots you have unlocked in the Underground (default 3)',
              required: false,
            },
            {
              name: 'days',
              type: 'INTEGER',
              description: 'Maximum number of days would you like to complete a chain for (default 14)',
              required: false,
            },
            {
              name: 'from-date',
              type: 'STRING',
              description: 'YYYY-MM-DD - Starting date for the daily chain (default today UTC)',
              required: false,
            },
          ],
        },
        {
          name: 'daily-deals',
          description: 'Get a list of daily deals for the next 5 days',
          options: [
            {
              name: 'from-date',
              type: 'STRING',
              description: 'YYYY-MM-DD - Starting date for the daily chain (default today UTC)',
              required: false,
            },
          ],
        },
        {
          name: 'donate',
          description: 'Get a PayPal Donate link to help with the server cost of the Discord bot',
        },
        {
          name: 'flip',
          description: 'Flip a coin and bet some money',
          options: [
            {
              name: 'bet-amount',
              type: 'STRING',
              description: 'How much money you want to bet',
              required: true,
            },
            {
              name: 'coin-side',
              type: 'STRING',
              description: 'Which side of the coin are you betting on',
              required: true,
              choices: [
                {
                  name: 'Heads',
                  value: 'heads',
                },
                {
                  name: 'Tails',
                  value: 'tails',
                },
              ],
            },
          ],
        },
        {
          name: 'fire-water-grass',
          description: 'Fire, Water, Grass _(Rock, Paper, Scissors)_ bet some money',
          options: [
            {
              name: 'bet-amount',
              type: 'STRING',
              description: 'How much money you want to bet',
              required: true,
            },
            {
              name: 'type',
              type: 'STRING',
              description: 'Which type are you betting on',
              required: true,
              choices: [
                {
                  name: 'Fire',
                  value: 'fire',
                },
                {
                  name: 'Water',
                  value: 'water',
                },
                {
                  name: 'Grass',
                  value: 'grass',
                },
              ],
            },
          ],
        },
        {
          name: 'reminder',
          description: 'Command for modifying reminders',
          options: [
            {
              name: 'view',
              type: 'SUB_COMMAND',
              description: 'View pending reminders',
            },
            {
              name: 'add',
              type: 'SUB_COMMAND',
              description: 'Add a new reminder',
              options: [
                {
                  name: 'time',
                  type: 'STRING',
                  description: 'How long until you want to be reminded',
                  required: true,
                },
                {
                  name: 'message',
                  type: 'STRING',
                  description: 'What you want to be reminded about',
                  required: true,
                },
              ],
            },
            {
              name: 'remove',
              type: 'SUB_COMMAND',
              description: 'Remove reminder(s)',
              options: [
                {
                  name: 'ids',
                  type: 'STRING',
                  description: 'Reminder ID(s) to remove',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          name: 'timely',
          description: 'Claim your 2 hourly PokéCoins',
        },
      ];

      return await client.guilds.cache.get('611852340752023552').commands.set(data);
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

    // Each argument should be split by 1 (or more) space character
    const args = message.content.slice(prefix.length).trim().split(/,?\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
      || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    // // Each argument should be split by 1 (or more) space character
    // const args = message.content.slice(prefix.length).trim().split(/,?\s+/);
    // const commandName = args.shift().toLowerCase();

    // Not a valid command
    if (!command) return;

    // Apply command cooldowns
    const timeLeft = cooldownTimeLeft(command.name, command.cooldown, message.author.id);
    if (timeLeft > 0) {
      return message.reply({ content: `Please wait ${Math.ceil(timeLeft * 10) / 10} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
    }

    // Run the command
    try {
      // Send the message object, along with the arguments, and the commandName (incase an alias was used)
      await command.execute(message, args, client);
      addStatistic(message.author, `!${command.name}`);
      const commandsSent = await addStatistic(message.author, 'commands');
      if (commandsSent >= 1000) {
        await addPurchased(message.author, 'badge', trainerCardBadgeTypes.Cascade);
      }
    } catch (err) {
      error(`Error executing command "${command.name}":\n`, err);
      message.reply('There was an error trying to execute that command!');
    }
  })
  .on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(interaction);

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
