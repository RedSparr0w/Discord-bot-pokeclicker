// Note: You may need to install the font to your system first
const { AttachmentBuilder, EmbedBuilder, ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { getAmount, getRank, getTrainerCard, getPurchased } = require('../database.js');
const { trainerCardColors, trainerCardBadges, getLastClaim } = require('../helpers.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

const numStr = num => num.toLocaleString('en-US');

// Register our font
GlobalFonts.registerFromPath('./assets/fonts/pokemon_fire_red.ttf', 'Fire Red');

module.exports = {
  type        : ApplicationCommandType.User,
  name        : 'trainer-card',
  aliases     : ['trainercard', 'tc', 'profile'],
  description : 'Get an image of your trainer card',
  args        : [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'Get another users trainer card',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks', 'AttachFiles'],
  userperms   : [],
  execute     : async (interaction) => {
    const id = interaction.options.get('user')?.value;

    let member = interaction.member;
    let user = interaction.user;

    if (id) {
      member = await interaction.guild.members.fetch(id).catch(e => {});
      if (!member) {
        const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Invalid user ID specified.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      user = member.user;
    }

    const balance = await getAmount(user);
    const rank = await getRank(user);
    const trainerCard = await getTrainerCard(user);
    const badges = await getPurchased(user, 'badge');
    const { streak: daily_streak } = await getLastClaim(user, 'daily_claim');
    const { streak: timely_streak } = await getLastClaim(user, 'timely_claim');
    
    // Create our base canvas
    const backgroundImage = await loadImage(`./assets/images/trainer_card/${trainerCardColors[trainerCard.background]}.png`);
    const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height);

    // Player image
    const playerImage = await loadImage(`./assets/images/trainers/${trainerCard.trainer}.png`);
    ctx.drawImage(playerImage, 160, 40, playerImage.width, playerImage.height);

    // Add our badge images
    for (const badge of badges.map((b, i) => b ? trainerCardBadges[i] : b).filter(b => b)) {
      const badgeImage = await loadImage(badge.src);
      ctx.drawImage(badgeImage, badge.left, badge.top, badgeImage.width, badgeImage.height);
    }

    // Add our text
    ctx.font = '16px Fire Red';
    ctx.fillStyle = '#333';
    ctx.fillText(`RANK No. ${rank.toString().padStart(3, 0)}`, 140, 22);
    // eslint-disable-next-line no-control-regex
    ctx.fillText((member.displayName).replace(/[^\x00-\x7F]/g, '').trim().substr(0, 33).toUpperCase() || 'TRAINER UNKNOWN', 21, 42);
    ctx.fillText('MONEY', 21, 70);
    ctx.fillText('DAILY STREAK', 21, 86);
    ctx.fillText('TIMELY STREAK', 21, 102);
    ctx.textAlign = 'right';
    ctx.fillText(`$ ${numStr(balance)}`, 145, 70);
    ctx.fillText(numStr(daily_streak), 145, 86);
    ctx.fillText(numStr(timely_streak), 145, 102);

    // export canvas as image
    const base64Image = await canvas.encode('png');
    const attachment = new AttachmentBuilder(base64Image, { name: 'trainer-card.png' });
    return interaction.reply({ files: [attachment] });
  },
};
