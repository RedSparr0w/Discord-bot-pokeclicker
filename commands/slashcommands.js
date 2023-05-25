/*
Command used to generate the list of aliases:
!eval
```js
const commands = msg.client.commands.map(c => [c.name, ...c.aliases]).flat();
return `'${msg.client.slashCommands.map(c => [c.name, ...c.aliases]).flat().filter(c => !commands.includes(c)).join("','")}'`;
```
*/

const { EmbedBuilder } = require('discord.js');
const { prefix } = require('../config');

module.exports = {
  name        : 'slashcommandinfo',
  aliases     : ['badges','balance','bal','$','berry','berries','bery','berri','beri','berrie','dailychain','dc','dailychains','chain','chains','daily-chain','dailydeal','dd','deals','dailydeals','ug','underground','daily-deals','donate','fire-water-grass', 'fwg','fgw','gfw','gwf','wfg','wgf','fire-water-grass','flip','coin','happyhour','hh','happy-hour','commands','pokemon','p','poke','pinfo','pokeinfo','reminder','remind','remindme','rm','roles','role','route','routes','routeinfo','shards','shard','shop','slots','slot','spin','wheel','statistics','stats','top','leaderboard','lb','trainer-card-shop','trainercardshop','tcshop','profileshop','trainer-card','trainercard','tc','profile', 'userinfo'],
  description : 'Slash command info',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : ['SendMessages'],
  execute     : async (msg, args) => {
    const commandName = msg.content.slice(prefix.length).trim().split(/,?\s+/).shift()?.toLowerCase();
    const command = msg.client.slashCommands.find(c => c.name == commandName || c.aliases?.includes(commandName));

    const embed = new EmbedBuilder()
      .setDescription(`It looks like you are trying to use a command,
This command has likely moved to a slash command.
Try using \`/${command ? command.name : 'help'}\` instead`)
      .setColor('Random');

    return msg.reply({ embeds: [embed] });
  },
};
