const { MessageEmbed } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { website } = require('../config.js');
const {
  berryType,
  berryList,
  gameVersion,
  formatSecondsFullLetters,
} = require('../helpers.js');

const berryStages = [
  'Sprout',
  'Taller',
  'Bloom',
  'Berry',
  'Wither',
];
const flavorTypes = [
  'Spicy',
  'Dry',
  'Sweet',
  'Bitter',
  'Sour',
];
const auraType = [
  'Growth',
  'Replant',
  'Mutation',
  'Harvest',
  'Egg',
  'Attract',
  'Shiny',
  'Death',
  'Boost',
];

const fuzzyBerry = FuzzySet(Object.keys(berryType), false);

module.exports = {
  name        : 'berry',
  aliases     : ['berries'],
  description : 'Get PokéClicker game info about a specific Berry',
  args        : ['id/name'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (msg, args) => {
    const id = args.join(' ').toLowerCase().trim();

    let berry = berryList.find(b => b.type == +id);
    if (!berry && isNaN(id)) {
      const newNames = fuzzyBerry.get(id);
      if (newNames) {
        berry = berryList.find(b => b.type == +berryType[newNames[0][1]]);
      }
    }
    if (!berry) return msg.channel.send('Berry not found..');

    const embed = new MessageEmbed()
      .setTitle(`#${berry.type >= 0 ? berry.type.toString().padStart(3, 0) : '???'} ${berryType[berry.type].toUpperCase()}`)
      .setThumbnail(`${website}assets/images/items/berry/${berryType[berry.type]}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`)
      .addField('\u200b', '\u200b', false) // Spacing
      .addField('Description', `${berry.description.join('\n')}`, false)
      .addField('\u200b', '\u200b', false) // Spacing
      .addField('<:farmPoint:751765173089468448> Farm Points', `${berry.farmValue.toLocaleString('en-US')}`, true)
      .addField('🍒 Harvest Amount', `${berry.harvestAmount}`, true)
      .addField('🌷 Replant Rate', `${Math.floor(berry.replantRate * 100)}%`, true)
      .addField('\u200b', '\u200b', false) // Spacing
      .addField('🌱 Growth Time', berry.growthTime.map((s, i) => `**${berryStages[i]}:** ${formatSecondsFullLetters(s, true)}`).join('\n'), true)
      .addField('🌶️ Flavor', berry.flavors.map((f) => `**${flavorTypes[f.type]}:** ${f.value}`).join('\n'), true);

    if (berry.aura) embed.addField('✨ Aura', `__**${auraType[berry.aura.auraType]} Bonus**__\n${berry.aura.auraMultipliers.map((m, i) => `**${berryStages[i+1]}**: ${m}×`).join('\n')}`, true);
    else embed.addField('\u200b', '\u200b', true); // Spacing

    embed.addField('\u200b', '\u200b', false); // Spacing

    // Add the wanderers in 3 columns
    const wanderers = [[], [], []];
    berry.wander.forEach((p, i) => wanderers[i % 3].push(p));
    wanderers.forEach((w, i) => embed.addField(!i ? '<:Pokeball:733980790718988348> Wanderers' : '\u200b', `${w.join('\n')}`, true));

    if (berry.hint) {
      embed.addField('\u200b', '\u200b', false); // Spacing
      embed.addField('❔ Hint', berry.hint, false);
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    msg.channel.send({ embed });
  },
};
