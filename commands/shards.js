const { MessageEmbed } = require('discord.js');
const { PokemonType, GameConstants, pokemonTypeIcons, RouteShardTypes, findShardRoutes, findShardBestRoute } = require('../helpers.js');

module.exports = {
  name        : 'shards',
  aliases     : ['s', 'shard'],
  description : 'Get a list of routes where you can obtain a particular type of shard',
  args        : ['type'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    let [type] = args;
    type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (!PokemonType.hasOwnProperty(type)) return msg.reply(`Invalid type: \`${type}\``);

    const embed = new MessageEmbed()
      // Replace type names with their icons
      .setTitle(`${pokemonTypeIcons[type]} ${type} Shard Routes`)
      //.setThumbnail(`https://pokeclicker-dev.github.io/pokeclicker/assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`)
      .setColor('#3498db')
      .setFooter('Data is up to date as of v0.4.12');

    const shardRoutes = findShardRoutes(RouteShardTypes, PokemonType[type]);
    Object.entries(shardRoutes).forEach(([region, routes]) => {
      if (!Object.entries(routes).length) return;
      const bestShardRoute = findShardBestRoute(RouteShardTypes, PokemonType[type], region);
      const description = ['Best Route:', `[${bestShardRoute.route}] ${bestShardRoute.chance}%`, '\nAll Routes:'];
      Object.entries(routes).forEach(([route, chance]) => {
        description.push(`[${route}] ${+chance.toFixed(2)}%`);
      });
      embed.addField(`❯ ${GameConstants.Region[region].toUpperCase()}`, `\`\`\`ini\n${description.join('\n')}\n\`\`\``, true);
    });

    // .addField('<:xAttackSmall:733974450864652380> Attack', `${pokemon.attack}`,true)
    // .addField('\u200b', '\u200b', true) // Spacing
    // .addField('<:Pokeball:733980790718988348> Catch Rate', `${pokemon.catchRatePercent}%`, true)
    // .addField('<:RareCandySmall:733974449774133299> Level Type', `${LevelType[pokemon.levelType]}`, true)
    // .addField('\u200b', '\u200b', true) // Spacing
    // .addField('<:Pokemon_egg:733973219177922591> Egg Steps', `${pokemon.eggSteps}`, true)
    // .addField('\u200b', '\u200b'); // Spacing

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    msg.channel.send({ embed });
  },
};
