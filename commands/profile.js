const { MessageAttachment } = require('discord.js');
const { getAmount, getRank, getTrainerCard } = require('../database.js');
const { trainerCardColors, getLastClaim } = require('../helpers.js');
const { Canvas, Image } = require('canvas');
const mergeImages = require('merge-images');
const text2png = require('text2png');
const fs =  require('fs');

const numStr = num => num.toLocaleString('en-US');

module.exports = {
  name        : 'profile',
  aliases     : ['trainercard', 'tc'],
  description : 'Get an image of your trainer badge',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'],
  userperms   : ['SEND_MESSAGES'],
  channels    : ['bot-commands', 'game-corner', 'bragging'],
  execute     : async (msg, args) => {
    const balance = await getAmount(msg.author);
    const rank = await getRank(msg.author);
    const trainerCard = await getTrainerCard(msg.author);
    const { streak: daily_streak } = await getLastClaim(msg.author, 'daily_claim');
    const { streak: timely_streak } = await getLastClaim(msg.author, 'timely_claim');

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
        src: text2png((msg.member.displayName).replace(/[^\x00-\x7F]/g, '').trim().substr(0, 33).toUpperCase(), {
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
    ], {
      Canvas,
      Image,
    }).then(b64 => {
      const base64Image = b64.split(';base64,').pop();
      
      fs.writeFile('trainer_card.png', base64Image, {encoding: 'base64'}, async function(err) {
        const attachment = await new MessageAttachment().setFile('trainer_card.png');

        return msg.channel.send(attachment);

        // const embed = new MessageEmbed()
        //   .setColor('#3498db')
        //   .attachFiles(attachment)
        //   .setImage('attachment://trainer_card.png');
  
        // return msg.channel.send({ embed });
      });
    });
  },
};
