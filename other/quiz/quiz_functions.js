const { createCanvas, loadImage } = require('@napi-rs/canvas');
const {
  pokemonList,
  randomFromArray,
} = require('../../helpers.js');
// Define these when we need them
let BSOD;
let backdropImage;

const loadQuizImages = async () => {
  // Load backdrop image
  backdropImage = await loadImage('./assets/images/backdrop/whos_that_pokemon.png');
  // Load and process BSOD image
  const bsodImage = await loadImage('./assets/images/backdrop/BSOD.png');
  const canvas = createCanvas(bsodImage.width, bsodImage.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bsodImage, 0, 0, bsodImage.width, bsodImage.height);
  BSOD = await canvas.encode('png');
};

const basePokemonIDs = [...new Set(pokemonList.map(p => Math.floor(p.id)))];

const getRandomPokemon = () => {
  const baseID = randomFromArray(basePokemonIDs);
  return randomFromArray(pokemonList.filter(p => Math.floor(p.id) == baseID));
};

const getWhosThatPokemonImage = (pokemon) => new Promise((resolve) => {
  const canvas = createCanvas(backdropImage.width, backdropImage.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(backdropImage, 0, 0, backdropImage.width, backdropImage.height);

  loadImage(`./assets/images/pokemon/${pokemon.id}.png`).then(pokemonImage => {
    // Make a temp canvas to draw the pokemon image shadow
    const _canvas = createCanvas(pokemonImage.width, pokemonImage.height);
    const _ctx = _canvas.getContext('2d');
    _ctx.fillStyle = '#222';
    _ctx.fillRect(0, 0, pokemonImage.width || pokemonImage.img.width, pokemonImage.height || pokemonImage.img.height);
    _ctx.globalCompositeOperation = 'destination-in';
    _ctx.drawImage(pokemonImage, 0, 0, pokemonImage.width, pokemonImage.height);
    ctx.drawImage(_canvas, 12, 0);
  
    // export canvas as image
    canvas.encode('png').then(img => resolve(img)).catch(() => resolve(BSOD));
  }).catch(() => resolve(BSOD));
});

const getWhosThatPokemonFinalImage = (pokemon, shiny) => new Promise((resolve) => {
  const canvas = createCanvas(backdropImage.width, backdropImage.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(backdropImage, 0, 0, backdropImage.width, backdropImage.height);

  loadImage(`./assets/images/${shiny ? 'shiny' : ''}pokemon/${pokemon.id}.png`).then(pokemonImage => {
    ctx.drawImage(pokemonImage, 12, 0, pokemonImage.width, pokemonImage.height);

    // export canvas as image
    canvas.encode('png').then(img => resolve(img)).catch(() => resolve(BSOD));
  }).catch(() => resolve(BSOD));
});

module.exports = {
  loadQuizImages,
  getRandomPokemon,
  getWhosThatPokemonImage,
  getWhosThatPokemonFinalImage,
};
