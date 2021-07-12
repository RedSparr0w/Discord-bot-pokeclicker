const { MessageEmbed } = require('discord.js');
const {
  PokemonType,
  GameConstants,
  pokemonTypeIcons,
  RouteShardTypes,
  findShardRoutes,
  findShardBestRoute,
  gameVersion,
} = require('../helpers.js');

module.exports = {
  type        : 'interaction',
  name        : 'shards',
  aliases     : ['s', 'shard'],
  description : 'Get a list of routes where you can obtain a particular type of shard',
  args        : ['type', 'order(chance|route)?'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const [
      type,
      order,
    ] = [
      interaction.options.get('type').value,
      interaction.options.get('order')?.value || 'chance',
    ];
    
    const sortFunc = order == 'chance' ? (a, b) => b[1] - a[1] : (a, b) => a[0] - b[0];

    const embed = new MessageEmbed()
      .setTitle(`${pokemonTypeIcons[type]} ${type} Shard Routes`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`);

    const shardRoutes = findShardRoutes(RouteShardTypes, PokemonType[type]);
    Object.entries(shardRoutes).forEach(([region, routes]) => {
      if (!Object.entries(routes).length) return;
      const bestShardRoute = findShardBestRoute(RouteShardTypes, PokemonType[type], region);
      const description = ['Best Route:', `${`[${bestShardRoute.route}]`.padEnd(4, ' ')} ${bestShardRoute.chance.toFixed(1).padStart(4,' ')}%`, '\nAll Routes:'];
      
      Object.entries(routes).sort(sortFunc).forEach(([route, chance]) => {
        description.push(`${`[${route}]`.padEnd(4, ' ')} ${chance.toFixed(1).padStart(4,' ')}%`);
      });
      embed.addField(`❯ ${GameConstants.Region[region].toUpperCase()}`, `\`\`\`ini\n${description.join('\n')}\n\`\`\``, true);
    });

    interaction.reply({ embeds: [embed] });
  },
};
