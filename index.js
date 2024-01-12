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
} = require('./helpers.js');
const {
  setupDB,
  backupDB,
  addPurchased,
  addStatistic,
  getStatistic,
} = require('./database.js');
const regexMatches = require('./regexMatches.js');
const { newQuiz } = require('./other/quiz/quiz.js');
const { sendReminders } = require('./other/reminder/reminder.js');
const { happyHourHours, startHappyHour, endHappyHour } = require('./other/quiz/happy_hour.js');
const { checkScheduledItems } = require('./other/scheduled/scheduled.js');
const { DAY } = require('./helpers/constants.js');

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
    if (!command) return;


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
    // Buttons
    if (interaction.isButton()) {
      // TODO: Move these out of our main file
      // Apply user for beta tester role
      if (interaction.customId == 'apply-beta-tester') {
        const member = interaction.member;
        const user = member.user;

        const joinDiscord = new Date(user.createdTimestamp);
        const joinServer = new Date(member.joinedTimestamp);
        const today = new Date();

        // Auto decline if member is new to the server (< 14 days)
        // TODO: maybe enable this at some point
        if (false && today - joinServer < 14 * DAY) {
          interaction.reply({ content: 'Please apply again later once you have been in the server for at least 2 weeks', ephemeral: true });
          return;
        }

        // Auto accept if member of server for more than 1 year
        // TODO: maybe enable this at some point
        if (false && today - joinServer > 365 * DAY) {
          const role = interaction.guild.roles.cache.find(r => r.name === 'Beta Tester');
          if (!role) return;

          member.roles.add(role);
          interaction.reply({ content: 'Welcome!\nYou are now a beta tester.', ephemeral: true });
          return;
        }

        // Send user to approval queue
        const warnings = await getStatistic(user, 'warnings');
        const messages = await getStatistic(user, 'messages');
    
        const embed = new Discord.EmbedBuilder()
          .setAuthor({
            name: user.tag,
            url: `https://discordapp.com/users/${user.id}`,
            iconURL: user.displayAvatarURL(),
          })
          .setDescription(user.toString())
          .setColor('#3498db')
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            {
              name: 'Joined Discord:',
              value: `<t:${Math.floor(+joinDiscord / 1000)}:R>`,
              inline: true,
            },
            {
              name: 'Joined Server:',
              value: `<t:${Math.floor(+joinServer / 1000)}:R>`,
              inline: true,
            },
            {
              name: '\u200b',
              value: '\u200b',
              inline: true,
            },
            {
              name: 'Warnings:',
              value: warnings?.toLocaleString() || 'unknown',
              inline: true,
            },
            {
              name: 'Message count:',
              value: messages?.toLocaleString() || 'unknown',
              inline: true,
            },
            {
              name: '\u200b',
              value: '\u200b',
              inline: true,
            },
            {
              name: 'Roles:',
              value: member?.roles?.cache?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => `${r}`)?.join('\n') || 'unknown',
              inline: false,
            }
          )
          .setFooter({ text: `ID: ${user.id}` })
          .setTimestamp();

        const buttons = new Discord.ActionRowBuilder();
        buttons.addComponents(
          new Discord.ButtonBuilder()
            .setCustomId('approve-beta-tester')
            .setLabel('Approve')
            .setStyle(Discord.ButtonStyle.Success)
            .setEmoji('☑️'),
          new Discord.ButtonBuilder()
            .setCustomId('decline-beta-tester')
            .setLabel('Decline')
            .setStyle(Discord.ButtonStyle.Danger),
        );

        interaction.guild.channels.cache.find(c => c.name === 'approval-queue').send({ embeds: [embed], components: [buttons] });
        interaction.reply({ content: 'Your application has been submitted for review!', ephemeral: true });
        return;
      }
      // Approve beta tester role
      if (interaction.customId == 'approve-beta-tester') {
        // Get the embeds attached to this interaction
        const embeds = interaction.message.embeds.map(e => Discord.EmbedBuilder.from(e));
        const user_id = embeds[0].toJSON().description.match(/<@!?(\d+)>/)[1];
        const member = await interaction.guild.members.fetch(user_id).catch(error);
        // Check they are still a member of the server
        if (!member) {
          embeds.forEach(e => e.setColor('#e74c3c'));
          embeds[embeds.length - 1].setFooter({ text: '🚫 No longer member..' }).setTimestamp()
          interaction.message.edit({ embeds, components: [] });
          interaction.reply({ content: `Unable to find member <@!${user_id}>..`, ephemeral: true });
          return;
        };
        const role = interaction.guild.roles.cache.find(r => r.name === 'Beta Tester');
        // Check the role exists in this server
        if (!role) {
          interaction.reply({ content: 'Unable to find Beta Tester role, try again later..', ephemeral: true });
          return;
        }
        // Apply the beta tester role
        member.roles.add(role);
        // Update our embed, remove the buttons
        embeds.forEach(e => e.setColor('#2ecc71'));
        embeds[embeds.length - 1].setFooter({ text: '☑️ Application approved!' }).setTimestamp()
        interaction.update({ embeds, components: [] });
        // Delete the application after x time
        setTimeout(() => interaction.message.delete().catch(e => console.error('Unable to delete approved application')), 1 * MINUTE);
        // Upadte the history channel
        const historyChannel = interaction.guild.channels.cache.find(c => c.name === 'approval-history');
        historyChannel.send({ embeds: [new Discord.EmbedBuilder().setColor('#2ecc71').setDescription(`☑️ Application approved!\nMember: <@!${user_id}>\nApproved by: ${interaction.user}`).setTimestamp()] });
        return;
      }
      // Decline beta tester role
      if (interaction.customId == 'decline-beta-tester') {
        // Get the embeds attached to this interaction
        const embeds = interaction.message.embeds.map(e => Discord.EmbedBuilder.from(e));
        // Update our embed, remove the buttons
        embeds.forEach(e => e.setColor('#e74c3c'));
        embeds[embeds.length - 1].setFooter({ text: '🚫 Application declined..' }).setTimestamp()
        interaction.update({ embeds, components: [] });
        // Delete the application after x time
        setTimeout(() => interaction.message.delete().catch(e => console.error('Unable to delete declined application')), 1 * MINUTE);
        // Upadte the history channel
        const user_id = embeds[0].toJSON().description.match(/<@!?(\d+)>/)[1];
        const historyChannel = interaction.guild.channels.cache.find(c => c.name === 'approval-history');
        historyChannel.send({ embeds: [new Discord.EmbedBuilder().setColor('#e74c3c').setDescription(`🚫 Application declined..\nMember: <@!${user_id}>\nApproved by: ${interaction.user}`).setTimestamp()] });
        return;
      }
    }
  });

client.login(token);
