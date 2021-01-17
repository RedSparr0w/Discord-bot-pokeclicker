const { MessageEmbed } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { website } = require('../config.js');
const {
  berryList,
  gameVersion,
} = require('../helpers.js');

const fuzzyBerries = FuzzySet(berryList.map(p => p.name.toLowerCase()), false);

module.exports = {
  name        : 'berry',
  aliases     : ['b'],
  description : 'Get basic information and a wiki link for berries',
  args        : ['id/name'],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands'],
  execute     : async (msg, args) => {
    const id = args.join(' ').toLowerCase().trim();

    let berry = berryList.find(p => p.id == +id || p.name.toLowerCase() == id);
    if (!berry && isNaN(id)) {
      const newNames = fuzzyBerries.get(id);
      if (newNames) {
        berry = berryList.find(p => p.name.toLowerCase() == newNames[0][1]);
      }
    }
    if (!berry) berry = berryList.find(p => p.id == 0);
    if (!berry) return;

    const embed = new MessageEmbed()
      .setTitle(`#${berry.id >= 0 ? berry.id.toString().padStart(2, 0) : '???'} ${berry.name.toUpperCase()}`)
      .setThumbnail(`${website}assets/images/berries/${berry.name}.png`)
      .setColor('#3498db')
      .setFooter(`Data is up to date as of v${gameVersion}`)
      .addField('Farm Points', `${berry.points}`,true)
      .addField('Harvest Amount', `${berry.harvest}`, true)
      .addField('Replant Rate', `${berry.replant}`, true)
      .addField('Total time from Ripe to Death', `${berry.growth}`, true)
      .addField('For more information visit the wiki', `${berry.description}`);
    // Spacing for the footer
    embed.addField('\u200b', '\u200b');

    msg.channel.send({ embed });
  },
};
