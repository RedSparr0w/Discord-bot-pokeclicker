const fs = require('fs');
const Discord = require('discord.js');
const { development, prefix, token, backupChannelID, mutedRoleID } = require('./config.js');
const {
  log,
  info,
  warn,
  error,
  gameVersion,
  RunOnInterval,
  formatChannelList,
  trainerCardBadgeTypes,
  processSaveFile,
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
const { checkScheduledItems } = require('./other/scheduled/scheduled.js');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
});

// Gather our available commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Gather our available slash commands (interactions)
client.slashCommands = new Discord.Collection();
const slashCommandsFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));
for (const file of slashCommandsFiles) {
  const command = require(`./slash_commands/${file}`);
  client.slashCommands.set(command.name, command);
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
  log(`Invite Link: https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands`);
  // Check the database is setup
  await setupDB();

  // Check for and send any reminders every minute
  new RunOnInterval(MINUTE, () => {
    // only run if we aren't running on a dev enviroment
    if (!development) sendReminders(client);
    checkScheduledItems(client);
  }, { timezone_offset: 0, run_now: true });

  // Update our status every hour
  new RunOnInterval(HOUR, () => {
    // Set our status
    client.user.setActivity(`PokéClicker v${gameVersion}`);
  }, { run_now: true });

  // Backup the database every 6 hours
  new RunOnInterval(6 * HOUR, () => {
    if (+backupChannelID) client.guilds.cache.forEach(guild => backupDB(guild));
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

    // Mute users who mass ping (4 or more users)
    if (message.mentions.users.size >= 4) {
      message.delete().catch(e=>{});
      message.member.roles.add(mutedRoleID, `User muted for mass ping (${message.mentions.users.size} users)`);
      return message.reply('You have been muted, Do not mass ping!');
    }
    
    if (!client.application || !client.application.owner) await client.application.fetch();

    // Process save files
    if (message.attachments && message.attachments.length) {
      message.attachments.forEach(file => {
        if (file.name.endsWith('.txt') || file.size <= 1e6) return processSaveFile(message, file);
      });
    }

    if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application.owner.id) {
      console.log('Deploying new commands!');
      // Add our slash commands
      const data = client.slashCommands.map(c => ({
        name: c.name,
        description: c.description,
        options: c.args,
        defaultPermission: (!c.userperms || c.userperms?.length == 0),
      }));
      // Add any context menu commands
      data.push(...client.slashCommands.filter(c => c.type).map(c => ({
        name: c.name,
        type: c.type,
        defaultPermission: (!c.userperms || c.userperms?.length == 0),
      })));
      // Update the current list of commands for this guild
      await message.guild.commands.set(data);

      const restrictCmds = client.slashCommands.filter(c => c.userperms?.length > 0).map(c => {
        const roleIDs = message.guild.roles.cache.filter(r => r.permissions.has(c.userperms)).map(r => r.id);
        c.roleIDs = roleIDs;
        return c;
      });

      const fullPermissions = message.guild.commands.cache.filter(c => restrictCmds.find(cmd => cmd.name === c.name)).map(c => {
        const cmd = restrictCmds.find(cmd => cmd.name === c.name);
        return {
          id: c.id,
          permissions: cmd.roleIDs.map(r => ({
            id: r,
            type: 'ROLE',
            permission: true,
          })),
        };
      });

      // Update the permissions for these commands
      await client.guilds.cache.get(message.guild.id.toString()).commands.permissions.set({ fullPermissions });
      message.reply(`Updated guild commands!\n\`\`\`yaml\nCommands: ${data.length}\nRestricted: ${fullPermissions.length}\n\`\`\``);

      return;
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
    if (!command) return;

    // Check the user has the required permissions
    if (message.channel.type === 'GUILD_TEXT' && message.channel.permissionsFor(message.member).missing(command.userperms).length) {
      return message.reply({ content: 'You do not have the required permissions to run this command.', ephemeral: true });
    }

    // Check the bot has the required permissions
    if (message.channel.type === 'GUILD_TEXT' && message.channel.permissionsFor(message.guild.me).missing(command.botperms).length) {
      return message.reply({ content: 'I do not have the required permissions to run this command.', ephemeral: true });
    }

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
    if (interaction.isCommand() || interaction.isContextMenu()) {

      const command = client.slashCommands.find(cmd => cmd.name === interaction.commandName);

      // Not a valid command
      if (!command) return interaction.reply({ content: 'Command not found..', ephemeral: true });

      // // Check if command needs to be executed inside a guild channel
      // if (command.guildOnly && message.channel.type !== 'GUILD_TEXT') {
      //   return message.channel.send('I can\'t execute that command inside DMs!');
      // }

      // Check the user has the required permissions
      if (interaction.channel.type === 'GUILD_TEXT' && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
        return interaction.reply({ content: 'You do not have the required permissions to run this command.', ephemeral: true });
      }

      // Check the bot has the required permissions
      if (interaction.channel.type === 'GUILD_TEXT' && interaction.channel.permissionsFor(interaction.guild.me).missing(command.botperms).length) {
        return interaction.reply({ content: 'I do not have the required permissions to run this command.', ephemeral: true });
      }

      const commandAllowedHere = (
        // User can manage the guild, and can use bot commands anywhere
        //interaction.channel.permissionsFor(interaction.member).missing(['MANAGE_GUILD']).length === 0 ||
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
    }
  });

client.login(token);
