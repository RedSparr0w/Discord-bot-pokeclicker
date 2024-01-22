const { MINUTE, HOUR } = require('./constants.js');
const { UndergroundItemValueType } = require('./pokeclicker.js');

const pokemonTypeIcons = {
  'Normal': '<:normal_icon:774090473215492117>',
  'Fire': '<:fire_icon:774090473391783946>',
  'Water': '<:water_icon:774090473463349298>',
  'Electric': '<:electric_icon:774090471873052732>',
  'Grass': '<:grass_icon:774090473476194325>',
  'Ice': '<:ice_icon:774090473353773087>',
  'Fighting': '<:fighting_icon:774090473966403585>',
  'Poison': '<:poison_icon:774090473396109312>',
  'Ground': '<:ground_icon:774090473017966644>',
  'Flying': '<:flying_icon:774090473191112725>',
  'Psychic': '<:psychic_icon:774090473148383253>',
  'Bug': '<:bug_icon:774090470363234355>',
  'Rock': '<:rock_icon:774090473454960640>',
  'Ghost': '<:ghost_icon:774090473290989569>',
  'Dragon': '<:dragon_icon:774090471827046470>',
  'Dark': '<:dark_icon:774090470535725056>',
  'Steel': '<:steel_icon:774090473295183923>',
  'Fairy': '<:fairy_icon:774090471764525058>',
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
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    this.state = Math.abs(this.state * this.MULTIPLIER) % this.MAX_UINT_32;
    return this.state / this.MAX_UINT_32;
  }
  static seedWithDate(d) {
    this.state = Number((d.getFullYear() - 1900) * d.getDate() + 1000 * d.getMonth() + 100000 * d.getDate());
  }
  // hours specifies how many hours the seed should remain the same
  static seedWithDateHour(d, hours = 1) {
    // Adjust date for timezone offset and hours rounded
    const time = d.getTime();
    const offset = -(d.getTimezoneOffset() * (MINUTE));
    const offsetTime = time + offset;
    const newDate = new Date(time - (offsetTime % (HOUR * hours)));
    const newHour = newDate.getHours();
    // Set state based on adjusted date
    this.seedWithDate(newDate);
    // Update state based on current hour
    this.state += 1000000 * newHour;
  }
  static seed(state) {
    this.state = Math.abs(state);
  }
  // get a number between min and max (both inclusive)
  static intBetween(min, max) {
    return Math.floor((max - min + 1) * this.next() + min);
  }
  // get a floored number from 0 to max (excluding max)
  static floor(max) {
    return Math.floor(this.next() * max);
  }
  // get a number from 0 to max (excluding max)
  static float(max) {
    return this.next() * max;
  }
  // 50/50 chance of true or false
  static boolean() {
    return !!this.intBetween(0, 1);
  }
  // If number is more than one, the chance is 1/chance otherwise the chance is a percentage
  static chance(chance) {
    return this.next() <= (chance >= 1 ? 1 / chance : chance);
  }
  // Pick an element from an array
  static fromArray(arr) {
    return arr[this.intBetween(0, arr.length - 1)];
  }
  // Pick an element from an array with specified weights
  static fromWeightedArray(arr, weights) {
    const max = weights.reduce((acc, weight) => acc + weight, 0);
    let rand = this.next() * max;
    return arr.find((_e, i) => (rand -= weights[i]) <= 0) || arr[0];
  }
  // Filters out any enum values that are less than 0 (for None)
  static fromEnum(_enum) {
    const arr = Object.keys(_enum).map(Number).filter((item) => item >= 0);
    return this.fromArray(arr);
  }
  // Get a string of letters and numbers (lowercase)
  static string(length) {
    return [...Array(length)].map(() => this.next().toString(36)[2]).join('');
  }
  // Shuffle an array
  static shuffleArray(arr) {
    const output = [...arr];
    for (let i = output.length; i; i--) {
      const j = this.floor(i);
      const x = output[i - 1];
      output[i - 1] = output[j];
      output[j] = x;
    }
    return output;
  }
  // Shuffle an array based on the weights of the items
  static shuffleWeightedArray(arr, weights) {
    const output = [];
    for (let i = 0; arr.length; i++) {
      const item = this.fromWeightedArray(arr, weights);
      const ind = arr.findIndex(a => a == item);
      arr.splice(ind, 1);
      weights.splice(ind, 1);
      output.push(item);
    }
    return output;
  }
}
SeededRand.state = 1234567890;
SeededRand.MAX_UINT_32 = Math.pow(2, 32) - 1;
SeededRand.MULTIPLIER = 987654321;

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
    // Exclude mega stones from daily deals
    return SeededRand.fromArray(UndergroundItem.list.filter(item => item.valueType !== UndergroundItemValueType.MegaStone));
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
    if (this.item1.valueType == UndergroundItemValueType.EvolutionItem
          || this.item1.valueType == UndergroundItemValueType.Shard) {
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
      'name': 'Blank Plate',
      'id': 117,
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
      'name': 'Black Augurite',
      'id': 310,
      'value': 1,
      'valueType': 5,
    },
    {
      'name': 'Peat Block',
      'id': 311,
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
    {
      'name': 'Beige Shard',
      'id': 415,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Slate Shard',
      'id': 416,
      'value': 0,
      'valueType': 2,
    },
    {
      'name': 'Aerodactylite',
      'id': 500,
      'value': 0,
      'valueType': 6,
    },
    {
      'name': 'Mawilite',
      'id': 501,
      'value': 0,
      'valueType': 6,
    },
    {
      'name': 'Sablenite',
      'id': 502,
      'value': 0,
      'valueType': 6,
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
