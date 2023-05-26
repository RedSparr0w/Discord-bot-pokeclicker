const { EmbedBuilder } = require('discord.js');
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
  botperms    : ['SendMessages', 'EmbedLinks'],
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

    const embed = new EmbedBuilder()
      .setTitle(`#${berry.type >= 0 ? (berry.type + 1).toString().padStart(2, 0) : '???'} ${berryType[berry.type].toUpperCase()}`)
      .setThumbnail(`${website}assets/images/items/berry/${berryType[berry.type]}.png`)
      .setColor('#3498db')
      .setFooter({ text: `Data is up to date as of v${gameVersion}` })
      .addFields({
        name: '\u200b',
        value: '\u200b',
        inline: false,
      }) // Spacing
      .addFields({
        name: 'Description',
        value: `${berry.description.join('\n')}`,
        inline: false,
      })
      .addFields({
        name: '\u200b',
        value: '\u200b',
        inline: false,
      }) // Spacing
      .addFields({
        name: '<:farmPoint:751765173089468448> Farm Points',
        value: `${berry.farmValue.toLocaleString('en-US')}`,
        inline: true,
      })
      .addFields({
        name: '🍒 Harvest Amount',
        value: `${berry.harvestAmount}`,
        inline: true,
      })
      .addFields({
        name: '🌷 Replant Rate',
        value: `${Math.floor(berry.replantRate * 100)}%`,
        inline: true,
      })
      .addFields({
        name: '\u200b',
        value: '\u200b',
        inline: false,
      }) // Spacing
      .addFields({
        name: '🌱 Growth Time',
        value: berry.growthTime.map((s, i) => `**${berryStages[i]}:** ${formatSecondsFullLetters(s, true)}`).join('\n'),
        inline: true,
      })
      .addFields({
        name: '🌶️ Flavor',
        value: berry.flavors.map((f) => `**${flavorTypes[f.type]}:** ${f.value}`).join('\n'),
        inline: true,
      });

    if (berry.aura) embed.addFields({
      name: '✨ Aura',
      value: `__**${auraType[berry.aura.auraType]} Bonus**__\n${berry.aura.auraMultipliers.map((m, i) => `**${berryStages[i+1]}**: ${m}×`).join('\n')}`,
      inline: true,
    });
    else embed.addFields({
      name: '\u200b',
      value: '\u200b',
      inline: true,
    }); // Spacing

    embed.addFields({
      name: '\u200b',
      value: '\u200b',
      inline: false,
    }); // Spacing

    // Add the wanderers in 3 columns
    const wanderers = [[], [], []];
    berry.wander.forEach((p, i) => wanderers[i % 3].push(p));
    wanderers.forEach((w, i) => embed.addFields({
      name: !i ? '<:Pokeball:974600141594034226> Wanderers' : '\u200b',
      value: `${w.join('\n')}`,
      inline: true,
    }));

    if (berry.hint) {
      embed.addFields({
        name: '\u200b',
        value: '\u200b',
        inline: false,
      }); // Spacing
      embed.addFields({
        name: '❔ Hint',
        value: berry.hint,
        inline: false,
      });
    }

    // Spacing for the footer
    embed.addFields({
      name: '\u200b',
      value: '\u200b',
    }); // Spacing

    interaction.reply({ embeds: [embed] });
  },
};
