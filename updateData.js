/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
let { website, wikiWebsite } = require('./config.js');
website = website.endsWith('/') ? website : `${website}/`;
wikiWebsite = wikiWebsite.endsWith('/') ? wikiWebsite : `${wikiWebsite}/`;

// Tidy up the result data with our eslint rules
const { ESLint } = require('eslint');

const cli = new ESLint({
  fix: true,
});

(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || null,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  console.log('=== PokéClicker Game ===');
  console.log(`navigate to ${website}\nwaiting for webpage to load..`);

  await page.goto(website);

  console.log('webpage loaded!\nwaiting for data to load..');

  page.evaluate(() => {
    App.start();
  });

  await page.waitForFunction(() => App.game &&  App.game.update && App.game.update.version);

  console.log('data loaded!\nupdating data..');

  const pokemonImageNames = await page.evaluate(() => pokemonList.flatMap(pokemon => [
    `${pokemon.id}.png`,
    ...(pokemon.gender.visualDifference ? [`${pokemon.id}-f.png`] : []),
  ]));

  const result = await page.evaluate(async () => {
    App.game.specialEvents.events.forEach(event => {
      if (event.hasStarted()) event.end();
    });
    
    const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const supportedLanguages = ['de','fr', 'es', 'it', 'ru', 'tr', 'ja', 'ko', 'zh-Hans', 'zh-Hant'];
    
    const getTranslatedNames = async () => {
      const result = {};
      const names = pokemonList.reduce((dict, p) => {
        dict[p.name] = App.translation.get(p.name, 'pokemon');
        return dict;
      }, {});

      for (lang of supportedLanguages) {
        const lastTranslationUpdate = App.translation.languageUpdated();
        Settings.setSettingByName('translation.language', lang);

        // wait for language to update
        if (lang !== 'en') {
          while (lastTranslationUpdate === App.translation.languageUpdated()) {
            await sleep(200);
          }
        }

        result[lang] = ko.toJS(names);
        // Filter out any names that are the same
        const pokemonNameNormalized = (name) => name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s?\([^|)]+\)/g, '').replace(/([?!\-_♂♀.'\s])/g, '.?');
        Object.keys(result[lang]).forEach(key => {
          if (pokemonNameNormalized(result[lang][key]) == pokemonNameNormalized(key) || pokemonNameNormalized(result[lang][key]) == '') {
            delete result[lang][key];
          }
        });
      }
      // Go back to english to ensure our hints etc are in english
      const lastTranslationUpdate = App.translation.languageUpdated();
      Settings.setSettingByName('translation.language', 'en');
      while (lastTranslationUpdate === App.translation.languageUpdated()) {
        await sleep(200);
      }
      return result;
    };
      

    const gyms = {};
    Object.entries(GymList).map(([key, value]) => {
      delete value.parent;
      gyms[key] = value;
    });

    // So we always get the correct weather/day requirements
    Weather.currentWeather = () => -1;
    DayOfWeekRequirement.prototype.getProgress = () => 0;
    MoonCyclePhaseRequirement.prototype.getProgress = () => 0;
    DayCyclePartRequirement.prototype.getProgress = () => 0;

    Requirement.prototype.toJSON = function() {
      const req = this.__proto__.constructor.name === 'LazyRequirementWrapper'
        ? this.unwrap()
        : this;
  
      let hint = '';
      try {
        hint = req.hint();
      } catch (e) {
        hint = 'unknown method';
      }

      return {
        ...Object.fromEntries(Object.entries(req)),
        hint,
        __class: req.__proto__.constructor.name,
      };
    };

    const pokeclickerData = {
      gameVersion: App.game.update.version,
      shopItems: App.game.discord.codes,
      regionRoutes: Routes.regionRoutes.map(route => ({
        routeName: route.routeName,
        region: route.region,
      })),
      PokemonLocationType,
      PokemonType,
      pokemonList: pokemonList.map(pokemon => {
        pokemon.locations = PokemonLocations.getPokemonLocations(pokemon.name);
        return pokemon;
      }),
      UndergroundItemValueType,
      GameConstants,
      BadgeEnums,
      GymList: gyms,
      berryType: BerryType,
      berryList: BerryList.map(berry => ({ type: berry.type, wander: berry.wander })),
      StoneType: GameConstants.StoneType,
      TranslatedPokemon: await getTranslatedNames(),
    };
    return `module.exports = ${JSON.stringify(pokeclickerData, null, 2)}`;
  });

  const results = await cli.lintText(result);
  const res = results[0];

  // Get the output after running through eslint
  const output = res.output;

  // Save the data
  await fs.writeFileSync('./helpers/pokeclicker.js', output);

  console.log('PokéClicker Game data updated!');
  console.log({ fileSise: output.length, errorCount: res.errorCount, warningCount: res.warningCount });

  let downloadedImages = 0;
  for (const directory of ['pokemon', 'shinypokemon']) {
    for (const imageName of pokemonImageNames) {
      const imagePath = path.join('assets', 'images', directory, imageName);
      if (fs.existsSync(imagePath)) continue;

      try {
        const response = await page.goto(`${website}assets/images/${directory}/${imageName}`);
        if (response?.ok()) {
          fs.writeFileSync(imagePath, await response.buffer());
          downloadedImages++;
        }
      } catch (e) {
        // The game does not have an image available at this path.
      }
    }
  }
  console.log(`Downloaded ${downloadedImages} missing Pokémon images`);

  // Update wiki data:
  if (wikiWebsite) {
    console.log('=== PokéClicker Wiki ===');
    console.log(`navigate to ${wikiWebsite}\nwaiting for webpage to load..`);

    await page.goto(wikiWebsite);

    console.log('webpage loaded!\ngathering data...');
    
    const wikiData = await page.evaluate(() => Wiki.searchOptions.map(({ display, type, page }) => ({ display, type, page })));

    const wikiResults = await cli.lintText(`module.exports = {\nwikiLinks: ${JSON.stringify(wikiData, null, 2)}}`);
    const wikiResult = wikiResults[0];

    // Get the output after running through eslint
    const wikiOutput = wikiResult.output;

    // Save the data
    await fs.writeFileSync('./helpers/pokeclickerWiki.js', wikiOutput);

    console.log('PokéClicker Wiki data updated!');
    console.log({ fileSise: wikiOutput.length });
  }

  await browser.close();
})();
