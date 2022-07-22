/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');
const { website, wikiWebsite } = require('./config.js');

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
    SpecialEvents.events.forEach(event => {
      if (event.hasStarted()) event.end();
    });

    const getRouteTypes = () => {
      const regionRoutes = {};
      Routes.regionRoutes.forEach(routeData => {
        if (!regionRoutes[routeData.region]) regionRoutes[routeData.region] = {};
        if (!regionRoutes[routeData.region][routeData.number]) regionRoutes[routeData.region][routeData.number] = {};
        Object.values(routeData.pokemon).flat().forEach(pName => {
          const pokemon = pokemonMap[pName];
          if (!pokemon || pokemon.id <= 0) return;
          if (!regionRoutes[routeData.region][routeData.number][pokemon.type[0]]) {
            regionRoutes[routeData.region][routeData.number][pokemon.type[0]] = 0;
          }
          regionRoutes[routeData.region][routeData.number][pokemon.type[0]]++;
          if (pokemon.type[1]) {
            if (!regionRoutes[routeData.region][routeData.number][pokemon.type[1]]) {
              regionRoutes[routeData.region][routeData.number][pokemon.type[1]] = 0;
            }
            regionRoutes[routeData.region][routeData.number][pokemon.type[1]]++;
          }
        });
        totalPokemon = Object.values(routeData.pokemon).flat().length;
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
      WeatherType,
      pokemonList: pokemonList.map(p => {
        p.locations = PokemonHelper.getPokemonLocations(p.name);
        p.catchRatePercent = PokemonFactory.catchRateHelper(p.catchRate, true);
        p.eggSteps = App.game.breeding.getSteps(p.eggCycles);
        return p;
      }),
      GameConstants,
      BadgeEnums,
      GymList: gyms,
      berryType: BerryType,
      berryList: App.game.farming.berryData.map(b => {
        const mutation = App.game.farming.mutations.find(m => m.mutatedBerry == b.type);
        if (mutation) b.hint = mutation.hint;
        return b;
      }),
    };
    return `module.exports = ${JSON.stringify(pokeclickerData, null, 2)}`;
  });

  // Tidy up the result data with our eslint rules
  const { ESLint } = require('eslint');

  const cli = new ESLint({
    fix: true,
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

    await page.goto(`${wikiWebsite}Special:AllPages?hideredirects=1`);

    console.log('webpage loaded!\nupdating data..');

    const wikiLinks = [];
    wikiLinks.push(...await page.evaluate(() => [...document.querySelectorAll('.mw-allpages-body [href]')].map(e => [e.title, e.href])));
    let pageNumber = 1;
    let nextPage = await page.evaluate(() => [...document.querySelectorAll('.mw-allpages-nav [href]')].map(e => [e.innerText, e.href])[0]);
    while (nextPage && nextPage.length && nextPage[0].startsWith('Next')) {
      ++pageNumber;
      console.log(`navigate to page ${pageNumber}\nwaiting for page ${pageNumber} to load..`);
      await page.goto(nextPage[1]);
      console.log(`page ${pageNumber} loaded!\nupdating data..`);
      wikiLinks.push(...await page.evaluate(() => [...document.querySelectorAll('.mw-allpages-body [href]')].map(e => [e.title, e.href])));
      nextPage = await page.evaluate(() => [...document.querySelectorAll('.mw-allpages-nav [href]')].map(e => [e.innerText, e.href])[0]);
    }
    // map to titles only, filter out duplicates, map to { title, link }
    const wikiData = { wikiLinks: [...new Set(wikiLinks.map(l => l[0]))].map(title => ({ title, link: wikiLinks.find(([t]) => t == title)[1] })) };

    const wikiResults = await cli.lintText(`module.exports = ${JSON.stringify(wikiData, null, 2)}`);
    const wikiResult = wikiResults[0];

    // Get the output after running through eslint
    const wikiOutput = wikiResult.output;

    // Save the data
    await fs.writeFileSync('./helpers/pokeclickerWiki.js', wikiOutput);

    console.log('PokéClicker Wiki data updated!');
    console.log({ fileSise: wikiOutput.length, errorCount: res.errorCount, warningCount: res.warningCount });
  }

  await browser.close();
})();
