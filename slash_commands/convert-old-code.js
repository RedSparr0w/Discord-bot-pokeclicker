const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { shopItems, SeededRand } = require('../helpers.js');
const { website } = require('../config.js');

class OldSeededRand {
  static next() {
    this.state = (this.state * this.MULTIPLIER + this.OFFSET) % this.MOD;
    return this.state / this.MOD;
  }
  static seedWithDate(d) {
    this.state = Number((d.getFullYear() - 1900) * d.getDate() + 1000 * d.getMonth() + 100000 * d.getDate());
  }
  static seed(state) {
    this.state = state;
  }
  static intBetween(min, max) {
    return Math.floor((max - min + 1) * this.next() + min);
  }
  static boolean() {
    return !!this.intBetween(0, 1);
  }
  static fromArray(arr) {
    return arr[this.intBetween(0, arr.length - 1)];
  }
  static fromEnum(arr) {
    arr = Object.keys(arr).map(Number).filter(item => item >= 0);
    return this.fromArray(arr);
  }
}
OldSeededRand.state = 12345;
OldSeededRand.MOD = 233280;
OldSeededRand.OFFSET = 49297;
OldSeededRand.MULTIPLIER = 9301;

const generateOldCode = (discordID, code) => {
  discordID = +discordID;
  // reverse the string (for names that are similar - forms)
  const codeSeed = code.split('').reverse()
    // map to the character code
    .map(l => l.charCodeAt(0))
    // multiply the numbers (should be random enough)
    .reduce((s,b) => s * (b / 10), 1);

  OldSeededRand.seed(discordID + codeSeed);

  const arr = [];
  for (let i = 0; i < 14; i++) {
    let char;
    while (char == undefined || char.length != 1) {
      char = OldSeededRand.intBetween(0, 35).toString(36);
    }
    arr.push(char);
  }

  arr[4] = '-';
  arr[9] = '-';

  return arr.join('').toUpperCase();
};

const generateCode = (discordID, code) => {
  discordID = +discordID;
  // reverse the string (for names that are similar - forms)
  const codeSeed = code.split('').reverse()
    // map to the character code
    .map(l => l.charCodeAt(0))
    // multiply the numbers (should be random enough)
    .reduce((s,b) => s * (b / 10), 1);

  SeededRand.seed(discordID + codeSeed);

  const arr = [];
  for (let i = 0; i < 14; i++) {
    let char;
    while (char == undefined || char.length != 1) {
      char = SeededRand.intBetween(0, 35).toString(36);
    }
    arr.push(char);
  }

  arr[4] = '-';
  arr[9] = '-';

  return arr.join('').toUpperCase();
};

module.exports = {
  name        : 'convert-old-code',
  aliases     : [],
  description : 'Convert an old purchased code pre v0.10.18',
  args        : [
    {
      name: 'code',
      type: ApplicationCommandOptionType.String,
      description: 'Original code to convert to new format',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    const item = shopItems.find(i => generateOldCode(interaction.user.id, i.name) === interaction.options.get('code').value.toUpperCase());
    if (!item) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`${interaction.user}\nInvalid code for this account.`, { ephemeral: true });
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder();
    if (item.image) embed.setThumbnail(website + item.image);
    embed.setDescription([
      `**${item.name}** Successfully purchased!`,
      '_Enter the following code in game to claim:_',
      '```',
      generateCode(interaction.user.id, item.name),
      '```',
      '',
      '**NOTE:**',
      '_You will need to link your Discord account in game before the code will work_',
      '`Start Menu` → `Save` → `Link Discord`',
    ].join('\n'));

    let error;
    await interaction.user.send({ embeds: [embed] }).catch(e => error = e).then(m => m.pin().catch(() => {}));
    // Error sending the code to the user, DM's might be disabled
    if (error) {
      embed.setColor('#e74c3c')
        .setDescription([
          interaction.user,
          'Failed to send you the code!',
          '',
          '_make sure you are able to receive direct messages_',
        ].join('\n'));
    } else {
      embed.setColor('#2ecc71')
        .setDescription([
          interaction.user,
          `**${item.name}** Successfully sent new code!`,
          '',
          '_code will be sent to you via direct message_',
        ].join('\n'));
    }
    return interaction.reply({ embeds: [embed] });
  },
};
