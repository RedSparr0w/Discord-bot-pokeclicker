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
  aliases     : ['berries', 'bery', 'berri', 'beri', 'berrie'],
  description : 'Get PokéClicker game info about a specific Berry',
  args        : [
    {
      name: 'berryname',
      type: 'STRING',
      description: 'Which berry you want info on (can be an ID or name)',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const id = interaction.options.get('berryname')?.value;

    let berry = berryList.find(b => b.type == (+id - 1));
    if (!berry && isNaN(id)) {
      const newNames = fuzzyBerry.get(id.toString());
      if (newNames) {
        berry = berryList.find(b => b.type == +berryType[newNames[0][1]]);
      }
    }
    if (!berry) return interaction.reply('Berry not found..', { ephemeral: true });

    const embed = new MessageEmbed()
      .setTitle(`#${berry.type >= 0 ? (berry.type + 1).toString().padStart(2, 0) : '???'} ${berryType[berry.type].toUpperCase()}`)
      .setThumbnail(`${website}assets/images/items/berry/${berryType[berry.type]}.png`)
      .setColor('#3498db')
      .setFooter({ text: `Data is up to date as of v${gameVersion}` })
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
    wanderers.forEach((w, i) => embed.addField(!i ? '<:Pokeball:974600141594034226> Wanderers' : '\u200b', `${w.join('\n')}`, true));

    if (berry.hint) {
      embed.addField('\u200b', '\u200b', false); // Spacing
      embed.addField('❔ Hint', berry.hint, false);
    }

    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    interaction.reply({ embeds: [embed] });
  },
};
