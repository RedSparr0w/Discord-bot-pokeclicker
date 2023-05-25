const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getAmount, getRank, getTrainerCard, getPurchased } = require('../database.js');
const { trainerCardColors, trainerCardBadges, getLastClaim } = require('../helpers.js');
const { Canvas, Image } = require('canvas');
const mergeImages = require('merge-images');
const text2png = require('text2png');
const fs =  require('fs');

const numStr = num => num.toLocaleString('en-US');

module.exports = {
  type        : 'USER',
  name        : 'trainer-card',
  aliases     : ['trainercard', 'tc', 'profile'],
  description : 'Get an image of your trainer card',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'Get another users trainer card',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
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

    mergeImages([
      // Base image
      `./assets/images/trainer_card/${trainerCardColors[trainerCard.background]}.png`,
      { // player image
        src: `./assets/images/trainers/${trainerCard.trainer}.png`,
        right: 20,
        bottom: 45,
      },
      { // Discord ID
        src: text2png(`RANK No. ${rank.toString().padStart(3, 0)}`, {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        left: 140,
        top: 14,
      },
      { // Discord tag
        // eslint-disable-next-line no-control-regex
        src: text2png((member.displayName).replace(/[^\x00-\x7F]/g, '').trim().substr(0, 33).toUpperCase() || 'TRAINER UNKNOWN', {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        left: 21,
        bottom: 106,
      },
      { // Money
        src: text2png('MONEY', {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        left: 21,
        bottom: 78,
      },
      {
        src: text2png(`$ ${numStr(balance)}`, {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        right: 85,
        bottom: 77,
      },
      { // Daily Streak
        src: text2png('DAILY STREAK', {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        left: 21,
        top: 78,
      },
      {
        src: text2png(numStr(daily_streak), {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        right: 85,
        top: 77,
      },
      { // Timely Streak
        src: text2png('TIMELY STREAK', {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        left: 21,
        top: 94,
      },
      {
        src: text2png(numStr(timely_streak), {
          font: '16px "pokemon_fire_red"',
          localFontPath: './assets/fonts/pokemon_fire_red.ttf',
          localFontName: 'pokemon_fire_red',
          color: '#333',
        }),
        right: 85,
        top: 93,
      },
      ...badges.map((b, i) => b ? trainerCardBadges[i] : b).filter(b => b),
    ], {
      Canvas,
      Image,
    }).then(b64 => {
      const base64Image = b64.split(';base64,').pop();
      
      fs.writeFile('trainer_card.png', base64Image, {encoding: 'base64'}, async function(err) {
        const attachment = await new AttachmentBuilder().setFile('trainer_card.png');

        return interaction.reply({ files: [attachment] });

        // const embed = new EmbedBuilder()
        //   .setColor('#3498db')
        //   .attachFiles(attachment)
        //   .setImage('attachment://trainer_card.png');
  
        // return interaction.reply({ embeds: [embed] });
      });
    });
  },
};
