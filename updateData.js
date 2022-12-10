/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
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
    SpecialEvents.events.forEach(event => {
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

    Requirement.prototype.toJSON = function() {
      const req = this.__proto__.constructor.name === 'LazyRequirementWrapper'
        ? this.unwrap()
        : this;
  
      return {
        ...Object.fromEntries(Object.entries(req)),
        hint: req.hint(),
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
        p.locations = PokemonHelper.getPokemonLocations(p.name);
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

    const getPages = (apcontinue = '') => {
      const params = {
        action: 'query',
        format: 'json',
        formatversion: 2,
        list: 'allpages',
        aplimit: 500,
        apnamespace: 0,
        apfilterredir: 'nonredirects',
        apcontinue: apcontinue,
      };
      
      let url = `${wikiWebsite}w/api.php?origin=*`;
      
      Object.keys(params).forEach((key) => {
        url += `&${key}=${params[key]}`;
      });

      return new Promise((resolve, reject) => {
        https.get(url, (resp)=>{

          let data = '';
        
          // A chunk of data has been received.
          resp.on('data', (chunk) => {
            data += chunk;
          });
        
          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          });
          
        }).on('error', (err) => {
          reject(`Error: ${err.message}`);
        });
      });
    };
    
    const pages = new Set();
    let apcontinue = '';
    let i = 0;

    do {
      const response = await getPages(apcontinue);
      apcontinue = response?.continue?.apcontinue || '';
      const allPages = response.query.allpages;
      allPages.forEach(p => pages.add(p.title));
      console.log(`processed page ${++i}`);
    } while (apcontinue);
    wikiLinks = [...pages]
      .filter(p => !p.includes(':'))
      .filter(p => !/\/\w{2,3}$/.test(p))
      .filter(p => !/Easter Egg/i.test(p))
      .map(title => ({
        title,
        link: `${wikiWebsite}wiki/${encodeURI(title.replace(/\s/g, '_'))}`,
      }));

    // set data
    const wikiData = { wikiLinks };

    const wikiResults = await cli.lintText(`module.exports = ${JSON.stringify(wikiData, null, 2)}`);
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
