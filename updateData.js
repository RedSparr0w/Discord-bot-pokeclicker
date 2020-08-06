/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://pokeclicker-dev.github.io/pokeclicker/');

  const result = await page.evaluate(() => {
    SpecialEvents.events.forEach(event => {
      if (event.hasStarted()) event.end();
    });

    const getRouteTypes = () => {
      const regionRoutes = {};
      Object.entries(pokemonsPerRoute).forEach(([region, routes]) => {
        regionRoutes[region] = {};
        Object.entries(routes).forEach(([route, encounterType]) => {
          regionRoutes[region][route] = {};
          Object.values(encounterType).flat().forEach(pName => {
            const pokemon = pokemonMap[pName];
            if (!pokemon || pokemon.id <= 0) return;
            if (!regionRoutes[region][route][pokemon.type[0]]) {
              regionRoutes[region][route][pokemon.type[0]] = 0;
            }
            regionRoutes[region][route][pokemon.type[0]]++;
            if (pokemon.type[1]) {
              if (!regionRoutes[region][route][pokemon.type[1]]) {
                regionRoutes[region][route][pokemon.type[1]] = 0;
              }
              regionRoutes[region][route][pokemon.type[1]]++;
            }
          });
          totalPokemon = Object.values(encounterType).flat().length;
          Object.entries(regionRoutes[region][route]).forEach(([type, amount]) => {
            regionRoutes[region][route][type] = +((amount / totalPokemon) * 100).toFixed(2);
          });
        });
      });
      return regionRoutes;
    };

    const pokeclickerData = {
      gameVersion: App.game.update.version,
      pokemonsPerRoute,
      RouteShardTypes: getRouteTypes(),
      PokemonLocationType,
      PokemonType,
      LevelType,
      levelRequirements,
      pokemonList: pokemonList.map(p => {
        p.locations = PokemonHelper.getPokemonLocations(p.name);
        p.catchRatePercent = PokemonFactory.catchRateHelper(p.catchRate, true);
        p.eggSteps = App.game.breeding.getSteps(p.eggCycles);
        return p;
      }),
      GameConstants,
    };
    return `module.exports = ${JSON.stringify(pokeclickerData, null, 2)}`;
  });

  // Tidy up the result data with our eslint rules
  const CLIEngine = require('eslint').CLIEngine;

  const cli = new CLIEngine({
    fix: true,
  });

  const report = cli.executeOnText(result, './helpers/pokeclicker.js');

  // Get the output after running through eslint
  const output = report.results[0].output;

  // Save the data
  await fs.writeFileSync('./helpers/pokeclicker.js', output);

  console.log({ fileSise: output.length, errorCount: report.errorCount, warningCount: report.warningCount });

  await browser.close();
})();
