/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');
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

  const result = await page.evaluate(() => {
    App.game.specialEvents.events.forEach(event => {
      if (event.hasStarted()) event.end();
    });

    const getRouteTypes = () => {
      const regionRoutes = {};
      Routes.regionRoutes.forEach(routeData => {
        // Check if data exist, otherwise create it as empty
        if (!regionRoutes[routeData.region]) regionRoutes[routeData.region] = {};
        if (!regionRoutes[routeData.region][routeData.number]) regionRoutes[routeData.region][routeData.number] = {};

        let totalPokemon = 0;

        // Go over all the pokemon in the route
        Object.values(routeData.pokemon).flat().forEach(pName => {
          // Note that we are excluding any special encounters at the moment
          // possibly add weather encounters later on (with an optional param on Discord)
          const pokemon = pokemonMap[pName];

          // Ignore MissingNo. and other pokemon with negative IDs (also special encounters currently)
          if (!pokemon || pokemon.id <= 0) return;

          // Make sure this types data exists on the route
          if (!regionRoutes[routeData.region][routeData.number][pokemon.type[0]]) {
            regionRoutes[routeData.region][routeData.number][pokemon.type[0]] = 0;
          }
          // Increment this type on the route
          regionRoutes[routeData.region][routeData.number][pokemon.type[0]]++;
          if (pokemon.type[1]) {
            // Make sure this types data exists on the route
            if (!regionRoutes[routeData.region][routeData.number][pokemon.type[1]]) {
              regionRoutes[routeData.region][routeData.number][pokemon.type[1]] = 0;
            }
            // Increment the 2nd type on the route
            regionRoutes[routeData.region][routeData.number][pokemon.type[1]]++;
          }

          totalPokemon++;
        });
        // Calculate percentage of each type on route
        Object.entries(regionRoutes[routeData.region][routeData.number]).forEach(([type, amount]) => {
          regionRoutes[routeData.region][routeData.number][type] = +((amount / totalPokemon) * 100).toFixed(2);
        });
      });
      return regionRoutes;
    };

    const gyms = {};
    Object.entries(GymList).map(([key, value]) => {
      delete value.parent;
      gyms[key] = value;
    });

    // So we always get the correct weather/day requirements
    Weather.currentWeather = () => -1;
    DayOfWeekRequirement.prototype.getProgress = () => 0;

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
      regionRoutes: Routes.regionRoutes,
      RouteGemTypes: getRouteTypes(),
      PokemonLocationType,
      PokemonType,
      LevelType,
      levelRequirements,
      EvolutionType,
      EvoTrigger,
      WeatherType,
      pokemonList: pokemonList.map(p => {
        p.locations = PokemonLocations.getPokemonLocations(p.name);
        p.catchRatePercent = PokemonFactory.catchRateHelper(p.catchRate, true);
        p.eggSteps = App.game.breeding.getSteps(p.eggCycles);
        return p;
      }),
      UndergroundItemValueType,
      GameConstants,
      BadgeEnums,
      GymList: gyms,
      berryType: BerryType,
      berryList: App.game.farming.berryData.map(b => {
        const mutation = App.game.farming.mutations.find(m => m.mutatedBerry == b.type);
        if (mutation) b.hint = mutation.hint;
        return b;
      }),
      StoneType: GameConstants.StoneType,
      RegionDungeons: GameConstants.RegionDungeons,
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

  // Update wiki data:
  if (wikiWebsite) {
    console.log('=== PokéClicker Wiki ===');
    console.log(`navigate to ${wikiWebsite}\nwaiting for webpage to load..`);

    await page.goto(wikiWebsite);

    console.log('webpage loaded!\ngathering data...');
    
    const wikiData = await page.evaluate(() => Wiki.searchOptions);

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
