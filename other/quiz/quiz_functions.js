const { Canvas, Image } = require('canvas');
const mergeImages = require('merge-images');

const getWhosThatPokemonImage = (pokemon) => new Promise((resolve) => {
  mergeImages([
    // Base image
    './assets/images/backdrop/whos_that_pokemon.png',
    { // pokemon image
      src: `./assets/images/pokemon/${pokemon.id}.png`,
      left: 12,
      top: 0,
      custom: (ctx, image) => {
        ctx.fillStyle = '#222';//GameConstants.TypeColor[pokemon.type[0]];
        ctx.fillRect(0, 0, image.width || image.img.width, image.height || image.img.height);
        ctx.globalCompositeOperation = 'destination-in';
      },
    },
  ], {
    Canvas,
    Image,
  }).then(b64 => resolve(b64.split(';base64,').pop()));
});

const getWhosThatPokemonFinalImage = (pokemon, shiny) => new Promise((resolve) => {
  mergeImages([
    // Base image
    './assets/images/backdrop/whos_that_pokemon.png',
    { // pokemon image
      src: `./assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`,
      left: 12,
      top: 0,
    },
  ], {
    Canvas,
    Image,
  }).then(b64 => resolve(b64.split(';base64,').pop()));
});

module.exports = {
  getWhosThatPokemonImage,
  getWhosThatPokemonFinalImage,
};
