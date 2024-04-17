const { InteractionType } = require('discord.js');
const fs = require('fs');
const Discord = require('discord.js');
const SpamDetection = require('./other/mod/spamdetection.js');
const { development, prefix, token, backupChannelID } = require('./config.js');
const {
  log,
  info,
  warn,
  error,
  gameVersion,
  RunOnInterval,
  formatChannelList,
  trainerCardBadgeTypes,
  trainerCardBadges,
  processSaveFile,
  MINUTE,
  HOUR,
  DAY,
} = require('./helpers.js');
const {
  setupDB,
  backupDB,
  addPurchased,
  addStatistic,
} = require('./database.js');
const regexMatches = require('./regexMatches.js');
const { newQuiz } = require('./other/quiz/quiz.js');
const { loadQuizImages } = require('./other/quiz/quiz_functions.js');
const { happyHourHours, startHappyHour, endHappyHour } = require('./other/quiz/happy_hour.js');
const { checkScheduledItems } = require('./other/scheduled/scheduled.js');
const { sendReminders } = require('./other/reminder/reminder.js');

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildEmojisAndStickers,
    Discord.GatewayIntentBits.GuildPresences,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.DirectMessageReactions,
    Discord.GatewayIntentBits.MessageContent,
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

// Gather our available button commands (interactions)
client.buttonCommands = new Discord.Collection();
const buttonCommandsFiles = fs.readdirSync('./button_commands').filter(file => file.endsWith('.js'));
for (const file of buttonCommandsFiles) {
  const command = require(`./button_commands/${file}`);
  client.buttonCommands.set(command.name, command);
}

// Gather our available button commands (interactions)
client.modalCommands = new Discord.Collection();
const modalCommandsFiles = fs.readdirSync('./modal_commands').filter(file => file.endsWith('.js'));
for (const file of modalCommandsFiles) {
  const command = require(`./modal_commands/${file}`);
  client.modalCommands.set(command.name, command);
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

  await loadQuizImages();

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
  }, { timezone_offset: 0, run_now: true });

  // Backup the database every 6 hours
  new RunOnInterval(6 * HOUR, () => {
    if (+backupChannelID) client.guilds.cache.forEach(guild => backupDB(guild));
  }, { timezone_offset: 0 });

  // Update our commands cache every day
  new RunOnInterval(DAY, () => {
    client.application.commands.fetch();
    client.guilds.cache.forEach(guild => guild.commands.fetch());
  }, { timezone_offset: 0, run_now: true });

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
    
    if (!client.application || !client.application.owner) await client.application.fetch();

    // Process save files
    if (message.attachments?.size) {
      message.attachments.forEach(file => {
        try {
          if (file.name?.endsWith('.txt') && file.size <= 1e6) return processSaveFile(message, file);
        } catch (e) {
          error('Unable to process save file:\n', e);
        }
      });
    }

    // Non command messages
    if (!message.content.startsWith(prefix)) {
      // Spam checking
      SpamDetection.check(message);

      // Add points for each message sent (every 30 seconds)
      const timeLeft = cooldownTimeLeft('messages', 30, message.author.id);
      if (!timeLeft) {
        const messagesSent = await addStatistic(message.author, 'messages');
        if (messagesSent == 2500) {
          const congratsEmbed = new Discord.EmbedBuilder().setTitle('Congratulations!').setColor('Random').setDescription([
            message.author.toString(),
            `You just earned the ${trainerCardBadges[trainerCardBadgeTypes.Thunder].icon} Thunder badge for sending ${messagesSent.toLocaleString('en-US')} messages on the server!`,
          ].join('\n'));
          message.channel.send({ embeds: [congratsEmbed] });
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
    if (!command) {
      // Spam checking
      SpamDetection.check(message);

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


    // Check if command needs to be executed inside a guild channel
    if (message.channel.type !== Discord.ChannelType.GuildText && command.guildOnly) {
      return message.channel.send('This command can only be executed within guild channels!');
    }

    // Check the user has the required permissions
    if (message.channel.type === Discord.ChannelType.GuildText && message.channel.permissionsFor(message.member).missing(command.userperms).length) {
      return message.reply({ content: 'You do not have the required permissions to run this command.', ephemeral: true });
    }
    
    // Check user has the required roles
    if (message.channel.type === Discord.ChannelType.GuildText && command.userroles?.length) {
      const hasRolePerms = command.userroles.some(r => message.member.roles.cache.find(role => role.id == r || role.name == r));
      if (!hasRolePerms) return message.reply({ content: 'You do not have the required roles to run this command.', ephemeral: true });
    }

    // Check the bot has the required permissions
    if (message.channel.type === Discord.ChannelType.GuildText && message.channel.permissionsFor(message.guild.members.me).missing(command.botperms).length) {
      return message.reply({ content: 'I do not have the required permissions to run this command.', ephemeral: true });
    }

    const commandAllowedHere = (
      // User can manage the guild, and can use bot commands anywhere
      //message.channel.permissionsFor(message.member).missing(['ManageGuild']).length === 0 ||
      // Command was run in `#****-bot`
      message.channel.name?.endsWith('-bot') ||
      // Command is allowed in this channel
      (!command.channels || command.channels.includes(message.channel.name))
    );

    if (!commandAllowedHere) {
      const output = [`This is not the correct channel for \`${prefix}${command.name}\`.`];
      if (command.channels && command.channels.length !== 0) {
        output.push(`Please try again in ${formatChannelList(message.guild, command.channels)}.`);
      }
      return message.reply({ content: output.join('\n'), ephemeral: true });
    }

    // Apply command cooldowns
    const timeLeft = Math.ceil(cooldownTimeLeft(command.name, command.cooldown, message.author.id) * 10) / 10;
    if (timeLeft > 0) {
      return message.reply({ content: `Please wait ${timeLeft} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
    }

    // Run the command
    try {
      // Send the message object, along with the arguments
      await command.execute(message, args);
      addStatistic(message.author, `!${command.name}`);
      const commandsSent = await addStatistic(message.author, 'commands');
      if (commandsSent >= 1000) {
        await addPurchased(message.author, 'badge', trainerCardBadgeTypes.Cascade);
      }
    } catch (err) {
      error(`Error executing command "${command.name}":\n`, err);
      message.reply({ content: 'There was an error trying to execute that command!'});
    }
  })
  .on('interactionCreate', async interaction => {
    // Slash commands, or right click commands
    if (interaction.type === InteractionType.ApplicationCommand || interaction.type === InteractionType.ContextMenu) {

      const command = client.slashCommands.find(cmd => cmd.name === interaction.commandName);

      // Not a valid command
      if (!command) return interaction.reply({ content: 'Command not found..', ephemeral: true });

      // Check the user has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
        return interaction.reply({ content: 'You do not have the required permissions to run this command.', ephemeral: true });
      }

      // Check user has the required roles
      if (interaction.channel.type === Discord.ChannelType.GuildText && command.userroles?.length) {
        const hasRolePerms = command.userroles.some(r => interaction.member.roles.cache.find(role => role.id == r || role.name == r));
        if (!hasRolePerms) return interaction.reply({ content: 'You do not have the required roles to run this command.', ephemeral: true });
      }

      // Check the bot has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.guild.members.me).missing(command.botperms).length) {
        return interaction.reply({ content: 'I do not have the required permissions to run this command.', ephemeral: true });
      }

      const commandAllowedHere = (
        // User can manage the guild, and can use bot commands anywhere
        //interaction.channel.permissionsFor(interaction.member).missing(['ManageGuild']).length === 0 ||
        // Command was run in `#****-bot`
        interaction.channel.name?.endsWith('-bot') ||
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
        // Send the message object
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
    // Button interactions
    if (interaction.isButton()) {
      const command = client.buttonCommands.find(cmd => cmd.name === interaction.customId);

      // Not a valid command
      if (!command) return;

      // Check the user has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
        return interaction.reply({ content: 'You do not have the required permissions to use this button.', ephemeral: true });
      }

      // Check user has the required roles
      if (interaction.channel.type === Discord.ChannelType.GuildText && command.userroles?.length) {
        const hasRolePerms = command.userroles.some(r => interaction.member.roles.cache.find(role => role.id == r || role.name == r));
        if (!hasRolePerms) return interaction.reply({ content: 'You do not have the required roles to use this button.', ephemeral: true });
      }

      // Check the bot has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.guild.members.me).missing(command.botperms).length) {
        return interaction.reply({ content: 'I do not have the required permissions to process this interaction.', ephemeral: true });
      }

      // Apply command cooldowns
      const timeLeft = Math.ceil(cooldownTimeLeft(`button-${command.name}`, command.cooldown, interaction.user.id) * 10) / 10;
      if (timeLeft > 0) {
        return interaction.reply({ content: `Please wait ${timeLeft} more second(s) before reusing this button.`, ephemeral: true });
      }

      // Run the command
      try {
        // Send the message object
        await command.execute(interaction).then(async e => {
          addStatistic(interaction.user, `!${command.name}`);
          const commandsSent = await addStatistic(interaction.user, 'commands');
          if (commandsSent >= 1000) {
            await addPurchased(interaction.user, 'badge', trainerCardBadgeTypes.Cascade);
          }
        }).catch(e => {
          throw(e);
        });
      } catch (err) {
        error(`Error executing command "${command.name}":\n`, err);
        interaction.replied ? interaction.followUp({ content: 'There was an error trying to process this interaction!', ephemeral: true }) : interaction.reply({ content: 'There was an error trying to process this interaction!', ephemeral: true });
      }
      return;
    }
    // Modal interactions
    if (interaction.isModalSubmit()) {
      const command = client.modalCommands.find(cmd => cmd.name === interaction.customId);

      // Not a valid command
      if (!command) return;

      // Check the user has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.member).missing(command.userperms).length) {
        return interaction.reply({ content: 'You do not have the required permissions to use this modal.', ephemeral: true });
      }

      // Check user has the required roles
      if (interaction.channel.type === Discord.ChannelType.GuildText && command.userroles?.length) {
        const hasRolePerms = command.userroles.some(r => interaction.member.roles.cache.find(role => role.id == r || role.name == r));
        if (!hasRolePerms) return interaction.reply({ content: 'You do not have the required roles to use this modal.', ephemeral: true });
      }

      // Check the bot has the required permissions
      if (interaction.channel.type === Discord.ChannelType.GuildText && interaction.channel.permissionsFor(interaction.guild.members.me).missing(command.botperms).length) {
        return interaction.reply({ content: 'I do not have the required permissions to process this interaction.', ephemeral: true });
      }

      // Apply command cooldowns
      const timeLeft = Math.ceil(cooldownTimeLeft(`modal-${command.name}`, command.cooldown, interaction.user.id) * 10) / 10;
      if (timeLeft > 0) {
        return interaction.reply({ content: `Please wait ${timeLeft} more second(s) before reusing this modal.`, ephemeral: true });
      }

      // Run the command
      try {
        // Send the message object
        await command.execute(interaction).then(async e => {
          addStatistic(interaction.user, `!${command.name}`);
          const commandsSent = await addStatistic(interaction.user, 'commands');
          if (commandsSent >= 1000) {
            await addPurchased(interaction.user, 'badge', trainerCardBadgeTypes.Cascade);
          }
        }).catch(e => {
          throw(e);
        });
      } catch (err) {
        error(`Error executing command "${command.name}":\n`, err);
        interaction.replied ? interaction.followUp({ content: 'There was an error trying to process this interaction!', ephemeral: true }) : interaction.reply({ content: 'There was an error trying to process this interaction!', ephemeral: true });
      }
      return;
    }
  });

client.login(token);
