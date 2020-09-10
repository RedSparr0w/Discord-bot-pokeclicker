/* eslint-disable no-undef */
const puppeteer = require('puppeteer');
const fs = require('fs');
const { website } = require('./config.json');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(website);

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

    const pokeclickerData = {
      gameVersion: App.game.update.version,
      shopItems: App.game.discord.codes,
      regionRoutes: Routes.regionRoutes,
      RouteShardTypes: getRouteTypes(),
      PokemonLocationType,
      PokemonType,
      LevelType,
      levelRequirements,
      EvolutionType,
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
