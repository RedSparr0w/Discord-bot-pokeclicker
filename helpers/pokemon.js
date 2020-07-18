const pokemonTypeIcons = {
  'Normal': '<:normal_icon:733983301890605068>',
  'Fire': '<:fire_icon:733983301085298749>',
  'Water': '<:water_icon:733983302641254400>',
  'Electric': '<:electric_icon:733983301345345566>',
  'Grass': '<:grass_icon:733983301290688513>',
  'Ice': '<:ice_icon:733983301647466537>',
  'Fighting': '<:fighting_icon:733983301160927235>',
  'Poison': '<:poison_icon:733983301831753759>',
  'Ground': '<:ground_icon:733983301404065813>',
  'Flying': '<:flying_icon:733983301437620254>',
  'Psychic': '<:psychic_icon:733983302310035517>',
  'Bug': '<:bug_icon:733983300393107468>',
  'Rock': '<:rock_icon:733983302335070239>',
  'Ghost': '<:ghost_icon:733983301446008893>',
  'Dragon': '<:dragon_icon:733983300963663923>',
  'Dark': '<:dark_icon:733983300947017738>',
  'Steel': '<:steel_icon:733983302326812683>',
  'Fairy': '<:fairy_icon:733983301244813362>',
};

const findShardBestRoute = (RouteShardTypes, type, onlyRegion = -1) => {
  let highestPercent = 0;
  let bestRoute = 0;
  Object.entries(RouteShardTypes).forEach(([region, routes]) => {
    if (onlyRegion >= 0 && onlyRegion != region) return;
    Object.entries(routes).forEach(([route, types]) => {
      if (types[type] && types[type] > highestPercent) {
        bestRoute = route;
        highestPercent = types[type];
      }
    });
  });
  return { route: bestRoute, chance: highestPercent };
};

const findShardRoutes = (RouteShardTypes, type) => {
  const regions = {};
  Object.entries(RouteShardTypes).forEach(([region, routes]) => {
    regions[region] = {};
    Object.entries(routes).forEach(([route, types]) => {
      if (types[type] > 0) {
        regions[region][route] = types[type];
      }
    });
  });
  return regions;
};

module.exports = {
  pokemonTypeIcons,
  findShardBestRoute,
  findShardRoutes,
};
