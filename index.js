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
          name: 'commands',
          description: 'List all of my commands or info about a specific command.',
          options: [
            {
              name: 'command',
              type: 'STRING',
              description: 'Get help on a specific command',
              required: false,
            },
          ],
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
          name: 'happy-hour',
          description: 'Check when the next happy hour is for #bot-coins',
        },
        {
          name: 'pokemon',
          description: 'Get PokéClicker game info about a specific Pokémon',
          options: [
            {
              name: 'name-id',
              type: 'STRING',
              description: 'Name or Pokédex ID of the Pokémon',
              required: true,
            },
            {
              name: 'shiny',
              type: 'BOOLEAN',
              description: 'Shiny image',
              required: false,
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
          name: 'roles',
          description: 'Get certain roles for updates and other stuff',
        },
        {
          name: 'route',
          description: 'Get PokéClicker game info about a specific route',
          options: [
            {
              name: 'number',
              type: 'INTEGER',
              description: 'Route number',
              required: true,
            },
            {
              name: 'region',
              type: 'INTEGER',
              description: 'Region name',
              required: false,
              choices: [
                // copy(GameHelper.enumStrings(GameConstants.Region).filter(r => r != 'none').map(r => `{
                //   name: '${r.replace(/\b\w/g, m => m.toUpperCase())}',
                //   value: ${GameConstants.Region[r]},
                // },`).join('\n'))
                {
                  name: 'Kanto',
                  value: 0,
                },
                {
                  name: 'Johto',
                  value: 1,
                },
                {
                  name: 'Hoenn',
                  value: 2,
                },
                {
                  name: 'Sinnoh',
                  value: 3,
                },
                {
                  name: 'Unova',
                  value: 4,
                },
                {
                  name: 'Kalos',
                  value: 5,
                },
                {
                  name: 'Alola',
                  value: 6,
                },
                {
                  name: 'Galar',
                  value: 7,
                },
                {
                  name: 'Armor',
                  value: 8,
                },
                {
                  name: 'Crown',
                  value: 9,
                },
              ],
            },
          ],
        },
        {
          name: 'shards',
          description: 'Get a list of routes where you can obtain a particular type of shard',
          options: [
            {
              name: 'type',
              type: 'STRING',
              description: 'Shard type',
              required: true,
              choices: [
                {
                  name: 'Normal',
                  value: 'Normal',
                },
                {
                  name: 'Fire',
                  value: 'Fire',
                },
                {
                  name: 'Water',
                  value: 'Water',
                },
                {
                  name: 'Electric',
                  value: 'Electric',
                },
                {
                  name: 'Grass',
                  value: 'Grass',
                },
                {
                  name: 'Ice',
                  value: 'Ice',
                },
                {
                  name: 'Fighting',
                  value: 'Fighting',
                },
                {
                  name: 'Poison',
                  value: 'Poison',
                },
                {
                  name: 'Ground',
                  value: 'Ground',
                },
                {
                  name: 'Flying',
                  value: 'Flying',
                },
                {
                  name: 'Psychic',
                  value: 'Psychic',
                },
                {
                  name: 'Bug',
                  value: 'Bug',
                },
                {
                  name: 'Rock',
                  value: 'Rock',
                },
                {
                  name: 'Ghost',
                  value: 'Ghost',
                },
                {
                  name: 'Dragon',
                  value: 'Dragon',
                },
                {
                  name: 'Dark',
                  value: 'Dark',
                },
                {
                  name: 'Steel',
                  value: 'Steel',
                },
                {
                  name: 'Fairy',
                  value: 'Fairy',
                },
              ],
            },
            {
              name: 'order',
              type: 'STRING',
              description: 'Order by',
              required: false,
              choices: [
                {
                  name: 'Chance',
                  value: 'chance',
                },
                {
                  name: 'Route',
                  value: 'route',
                },
              ],
            },
          ],
        },
        {
          name: 'shop',
          description: 'View stuff you can buy with your money for in game',
          options: [
            {
              name: 'page',
              type: 'INTEGER',
              description: 'Which start page',
              required: false,
            },
          ],
        },
        {
          name: 'slots',
          description: 'Spin the slots and bet some money',
          options: [
            {
              name: 'bet-amount',
              type: 'STRING',
              description: 'How much money you want to bet',
              required: true,
            },
            {
              name: 'lines',
              type: 'INTEGER',
              description: 'How many lines you want to play (default 3)',
              required: false,
              choices: [
                {
                  name: '1',
                  value: 1,
                },
                {
                  name: '2',
                  value: 2,
                },
                {
                  name: '3',
                  value: 3,
                },
              ],
            },
          ],
        },
        {
          name: 'spin',
          description: 'Spin the wheel and bet some money',
          options: [
            {
              name: 'bet-amount',
              type: 'STRING',
              description: 'How much money you want to bet',
              required: true,
            },
          ],
        },
        {
          name: 'statistics',
          description: 'Get an image of your trainer card',
          options: [
            {
              name: 'user',
              type: 'USER',
              description: 'Get another users statistics',
              required: false,
            },
          ],
        },
        {
          name: 'timely',
          description: 'Claim your 2 hourly PokéCoins',
        },
        {
          name: 'top',
          description: 'Spin the slots and bet some money',
          options: [
            {
              name: 'type',
              type: 'STRING',
              description: 'How many lines you want to play (default 3)',
              required: false,
              choices: [
                {
                  name: 'Answers',
                  value: 'answers',
                },
                {
                  name: 'Quiz',
                  value: 'answers',
                },
                {
                  name: 'Messages',
                  value: 'messages',
                },
                {
                  name: 'Commands',
                  value: 'commands',
                },
                {
                  name: 'Timely',
                  value: 'timely',
                },
                {
                  name: 'Daily',
                  value: 'daily',
                },
                {
                  name: 'Coins',
                  value: 'coins',
                },
              ],
            },
          ],
        },
        {
          name: 'trainer-card',
          description: 'Get an image of your trainer card',
          options: [
            {
              name: 'user',
              type: 'USER',
              description: 'Get another users trainer card',
              required: false,
            },
          ],
        },
        {
          name: 'trainer-card-shop',
          description: 'View stuff you can buy with your money for your trainer card',
          options: [
            {
              name: 'page',
              type: 'INTEGER',
              description: 'Which start page',
              required: false,
            },
          ],
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
        regexMatches.forEach(match => {
          if (match.regex.test(message.content)) {
            match.execute(message, client);
          }
        });
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

    // Not a valid command
    if (!command || command.type == 'interaction') return;

    // Apply command cooldowns
    const timeLeft = Math.ceil(cooldownTimeLeft(command.name, command.cooldown, message.author.id) * 10) / 10;
    if (timeLeft > 0) {
      return message.reply({ content: `Please wait ${timeLeft} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
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

    const command = client.commands.get(interaction.commandName)
      || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));

    // Not a valid command
    if (!command || command.type !== 'interaction') return;

    // // Check if command needs to be executed inside a guild channel
    // if (command.guildOnly && message.channel.type !== 'text') {
    //   return message.channel.send('I can\'t execute that command inside DMs!');
    // }

    // Check the user has the required permissions
    if (interaction.channel.type === 'text' && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
      return interaction.reply({ content: 'You do not have the required permissions to run this command.', ephemeral: true });
    }

    // Check the bot has the required permissions
    if (interaction.channel.type === 'text' && interaction.channel.permissionsFor(interaction.guild.me).missing(command.botperms).length) {
      return interaction.reply({ content: 'I do not have the required permissions to run this command.', ephemeral: true });
    }

    const commandAllowedHere = (
      // User can manage the guild, and can use bot commands anywhere
      interaction.channel.permissionsFor(interaction.member).missing(['MANAGE_GUILD']).length === 0 ||
      // Command was run in `#****-bot`
      interaction.channel.name.endsWith('-bot') ||
      // Command is allowed in this channel
      (!command.channels || command.channels.includes(interaction.channel.name))
    );

    if (!commandAllowedHere) {
      const output = [`This is not the correct channel for \`/${command.name}\`.`];
      if (command.channels && command.channels.length !== 0) {
        output.push(`Please try again in ${formatChannelList(interaction.guild, command.channels)}.`);
      }
      return interaction.reply({ content: output.join('\n'), ephemeral: true });
    }

    // Apply command cooldowns
    const timeLeft = Math.ceil(cooldownTimeLeft(command.name, command.cooldown, interaction.user.id) * 10) / 10;
    if (timeLeft > 0) {
      return interaction.reply({ content: `Please wait ${timeLeft} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
    }

    // Run the command
    try {
      // Send the message object, along with the arguments, and the commandName (incase an alias was used)
      await command.execute(interaction).catch(e => {
        throw(e);
      });
      addStatistic(interaction.user, `!${command.name}`);
      const commandsSent = await addStatistic(interaction.user, 'commands');
      if (commandsSent >= 1000) {
        await addPurchased(interaction.user, 'badge', trainerCardBadgeTypes.Cascade);
      }
    } catch (err) {
      error(`Error executing command "${command.name}":\n`, err);
      interaction.replied ? interaction.followUp({ content: 'There was an error trying to execute that command!', ephemeral: true }) : interaction.reply({ content: 'There was an error trying to execute that command!', ephemeral: true });
    }
  });

client.login(token);
