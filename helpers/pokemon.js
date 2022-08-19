const { UndergroundItemValueType } = require('./pokeclicker.js');

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

const findGemBestRoute = (RouteGemTypes, type, onlyRegion = -1) => {
  let highestPercent = 0;
  let bestRoute = 0;
  Object.entries(RouteGemTypes).forEach(([region, routes]) => {
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

const findGemRoutes = (RouteGemTypes, type) => {
  const regions = {};
  Object.entries(RouteGemTypes).forEach(([region, routes]) => {
    regions[region] = {};
    Object.entries(routes).forEach(([route, types]) => {
      if (types[type] > 0) {
        regions[region][route] = types[type];
      }
    });
  });
  return regions;
};

class SeededRand {
  static next() {
    this.state = (this.state * this.MULTIPLIER + this.OFFSET) % this.MOD;
    return this.state / this.MOD;
  }
  static seedWithDate(d) {
    this.state = Number((d.getFullYear() - 1900) * d.getDate() + 1000 * d.getMonth() + 100000 * d.getDate());
  }
  static seed(state) {
    this.state = state;
  }
  static intBetween(min, max) {
    return Math.floor((max - min + 1) * SeededRand.next() + min);
  }
  static boolean() {
    return !!this.intBetween(0, 1);
  }
  static fromArray(arr) {
    return arr[SeededRand.intBetween(0, arr.length - 1)];
  }
  static fromEnum(arr) {
    arr = Object.keys(arr).map(Number).filter(item => item >= 0);
    return this.fromArray(arr);
  }
}
SeededRand.state = 12345;
SeededRand.MOD = 233280;
SeededRand.OFFSET = 49297;
SeededRand.MULTIPLIER = 9301;
class DailyDeal {
  constructor() {
    this.item1 = DailyDeal.randomItem();
    this.amount1 = DailyDeal.randomAmount();
    this.item2 = DailyDeal.randomItem();
    this.amount2 = DailyDeal.randomAmount();
  }
  static generateDeals(maxDeals, date) {
    SeededRand.seedWithDate(date);
    DailyDeal.list = [];
    const temp = [];
    const maxTries = maxDeals * 10;
    let i = 0;
    while (i < maxTries && temp.length < maxDeals) {
      const deal = new DailyDeal();
      if (deal.isValid(temp)) {
        temp.push(deal);
      }
      i++;
    }
    DailyDeal.list.push(...temp);
  }
  static randomItem() {
    return SeededRand.fromArray(UndergroundItem.list);
  }
  static randomAmount() {
    return SeededRand.intBetween(1, 3);
  }
  isValid(dealList) {
    const item1Name = this.item1.name;
    const item2Name = this.item2.name;

    if (item1Name == item2Name) {
      return false;
    }

    // Left side item cannot be Evolution Item or Shard
    if (
      this.item1.valueType == UndergroundItemValueType.EvolutionItem
          || this.item1.valueType == UndergroundItemValueType.Shard
    ) {
      return false;
    }

    if (DailyDeal.sameDealExists(item1Name, item2Name, dealList)) {
      return false;
    }

    if (DailyDeal.reverseDealExists(item1Name, item2Name, dealList)) {
      return false;
    }

    return true;
  }
  static sameDealExists(name1, name2, dealList) {
    for (const deal of dealList) {
      if (deal.item1.name == name1 && deal.item2.name == name2) {
        return true;
      }
    }
    return false;
  }
  static reverseDealExists(name1, name2, dealList) {
    for (const deal of dealList) {
      if (deal.item2.name == name1) {
        if (deal.item1.name == name2) {
          return true;
        } else {
          return DailyDeal.reverseDealExists(deal.item1.name, name2, dealList);
        }
      }
    }
    return false;
  }
}
DailyDeal.list = [];

// copy('const UndergroundItem = ' + JSON.stringify({list: UndergroundItems.list.map(i => ({name: i.name, id: i.id, value: i.value, valueType: i.valueType}))}, null, 2) + ';\n')
const UndergroundItem = {
  'list': [
    {
      'name': 'Rare Bone',
      'id': 1,
      'value': 3,
      'valueType': 0,
    },
    {
      'name': 'Star Piece',
      'id': 2,
      'value': 5,
      'valueType': 0,
    },
    {
      'name': 'Revive',
      'id': 3,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Max Revive',
      'id': 4,
      'value': 4,
      'valueType': 0,
    },
    {
      'name': 'Iron Ball',
      'id': 5,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Heart Scale',
      'id': 6,
      'value': 10,
      'valueType': 0,
    },
    {
      'name': 'Light Clay',
      'id': 7,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Odd Keystone',
      'id': 8,
      'value': 6,
      'valueType': 0,
    },
    {
      'name': 'Hard Stone',
      'id': 9,
      'value': 4,
      'valueType': 0,
    },
    {
      'name': 'Oval Stone',
      'id': 10,
      'value': 3,
      'valueType': 0,
    },
    {
      'name': 'Everstone',
      'id': 11,
      'value': 3,
      'valueType': 0,
    },
    {
      'name': 'Smooth Rock',
      'id': 12,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Heat Rock',
      'id': 13,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Icy Rock',
      'id': 14,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Damp Rock',
      'id': 15,
      'value': 2,
      'valueType': 0,
    },
    {
      'name': 'Draco Plate',
      'id': 100,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Dread Plate',
      'id': 101,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Earth Plate',
      'id': 102,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Fist Plate',
      'id': 103,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Flame Plate',
      'id': 104,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Icicle Plate',
      'id': 105,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Insect Plate',
      'id': 106,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Iron Plate',
      'id': 107,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Meadow Plate',
      'id': 108,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Mind Plate',
      'id': 109,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Sky Plate',
      'id': 110,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Splash Plate',
      'id': 111,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Spooky Plate',
      'id': 112,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Stone Plate',
      'id': 113,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Toxic Plate',
      'id': 114,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Zap Plate',
      'id': 115,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Pixie Plate',
      'id': 116,
      'value': 100,
      'valueType': 1,
    },
    {
      'name': 'Helix Fossil',
      'id': 200,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Dome Fossil',
      'id': 201,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Old Amber',
      'id': 202,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Root Fossil',
      'id': 203,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Claw Fossil',
      'id': 204,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Armor Fossil',
      'id': 205,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Skull Fossil',
      'id': 206,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Cover Fossil',
      'id': 207,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Plume Fossil',
      'id': 208,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Jaw Fossil',
      'id': 209,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Sail Fossil',
      'id': 210,
      'value': 0,
      'valueType': 3,
    },
    {
      'name': 'Fossilized Bird',
      'id': 211,
      'value': 0,
      'valueType': 4,
    },
    {
      'name': 'Fossilized Fish',
      'id': 212,
      'value': 0,
      'valueType': 4,
    },
    {
      'name': 'Fossilized Drake',
      'id': 213,
      'value': 0,
      'valueType': 4,
    },
    {
      'name': 'Fossilized Dino',
      'id': 214,
      'value': 0,
      'valueType': 4,
    },
    {
      'name': 'Fire Stone',
      'id': 300,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Water Stone',
      'id': 301,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Thunder Stone',
      'id': 302,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Leaf Stone',
      'id': 303,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Moon Stone',
      'id': 304,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Sun Stone',
      'id': 305,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Shiny Stone',
      'id': 306,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Dusk Stone',
      'id': 307,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Dawn Stone',
      'id': 308,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Ice Stone',
      'id': 309,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Red Shard',
      'id': 400,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Yellow Shard',
      'id': 401,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Green Shard',
      'id': 402,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Blue Shard',
      'id': 403,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Grey Shard',
      'id': 404,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Purple Shard',
      'id': 405,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Ochre Shard',
      'id': 406,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Black Shard',
      'id': 407,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Crimson Shard',
      'id': 408,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Lime Shard',
      'id': 409,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'White Shard',
      'id': 410,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Pink Shard',
      'id': 411,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Cyan Shard',
      'id': 412,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Rose Shard',
      'id': 413,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Brown Shard',
      'id': 414,
      'value': 0,
      'valueType': 2,
    },
  ],
};



module.exports = {
  pokemonTypeIcons,
  findGemBestRoute,
  findGemRoutes,
  SeededRand,
  DailyDeal,
  UndergroundItem,
};
