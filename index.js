const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const {
  log,
  info,
  warn,
  error,
} = require('./helpers.js');
const { setupDB } = require('./database.js');

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
});

client.on('error', e => error('Client error thrown:', e))
  .on('warn', warning => warn(warning))
  .on('message', message => {
    // Either not a command or a bot, ignore
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) {
      // Auto react to comments if 2+ lines start with an emoji
      const emoji_regex = /^((?:<:.+?:)\d+|[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
      const lines = message.content.split(/\r?\n/).map(line=>line.trim());
      const answers = lines.filter(line=>emoji_regex.test(line));
      if (answers.length < 2) return;
      const addReaction = (reaction, cb) =>{
        setTimeout(async () => {
          await message.react(reaction).catch(O_o=>{});
          cb();
        }, 100);
      };

      const reactions = answers.map(answer=>answer.match(emoji_regex)[1]);
      reactions.reduce((promiseChain, reaction) => promiseChain.then(() => new Promise((resolve) => {
        addReaction(reaction, resolve);
      })), Promise.resolve());
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
    if (message.channel.type === 'text' && message.channel.memberPermissions(message.member).missing(command.userperms).length) {
      return message.reply('You do not have the required permissions to run this command.');
    }

    // Check the bot has the required permissions
    if (message.channel.type === 'text' && message.channel.memberPermissions(message.guild.me).missing(command.botperms).length) {
      return message.reply('I do not have the required permissions to run this command.');
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
