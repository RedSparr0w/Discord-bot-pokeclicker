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
  static randomItem() {
    return UndergroundItem.list[Math.floor(UndergroundItem.list.length * SeededRand.next())];
  }
  static randomAmount() {
    return Math.floor(3 * SeededRand.next()) + 1;
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
  isValid(dealList) {
    const item1Name = this.item1.name;
    const item2Name = this.item2.name;
    if (item1Name == item2Name) {
      return false;
    }
    if (this.item1.isStone) {
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

// Import: copy('const UndergroundItem = ' + JSON.stringify({list: UndergroundItem.list.map(i => ({name: i.name, id: i.id, value: i.value, valueType: i.valueType, isStone: i.isStone()}))}) + ';\n')
const UndergroundItem = {'list':[{'name':'Rare Bone','id':1,'value':3,'valueType':'Diamond','isStone':false},{'name':'Star Piece','id':2,'value':5,'valueType':'Diamond','isStone':false},{'name':'Revive','id':3,'value':2,'valueType':'Diamond','isStone':false},{'name':'Max Revive','id':4,'value':4,'valueType':'Diamond','isStone':false},{'name':'Iron Ball','id':5,'value':2,'valueType':'Diamond','isStone':false},{'name':'Heart Scale','id':6,'value':10,'valueType':'Diamond','isStone':false},{'name':'Light Clay','id':7,'value':2,'valueType':'Diamond','isStone':false},{'name':'Odd Keystone','id':8,'value':6,'valueType':'Diamond','isStone':false},{'name':'Hard Stone','id':9,'value':4,'valueType':'Diamond','isStone':false},{'name':'Oval Stone','id':10,'value':3,'valueType':'Diamond','isStone':false},{'name':'Everstone','id':11,'value':3,'valueType':'Diamond','isStone':false},{'name':'Smooth Rock','id':12,'value':2,'valueType':'Diamond','isStone':false},{'name':'Heat Rock','id':13,'value':2,'valueType':'Diamond','isStone':false},{'name':'Icy Rock','id':14,'value':2,'valueType':'Diamond','isStone':false},{'name':'Damp Rock','id':15,'value':2,'valueType':'Diamond','isStone':false},{'name':'Draco Plate','id':100,'value':100,'valueType':'dragon','isStone':false},{'name':'Dread Plate','id':101,'value':100,'valueType':'dark','isStone':false},{'name':'Earth Plate','id':102,'value':100,'valueType':'ground','isStone':false},{'name':'Fist Plate','id':103,'value':100,'valueType':'fighting','isStone':false},{'name':'Flame Plate','id':104,'value':100,'valueType':'fire','isStone':false},{'name':'Icicle Plate','id':105,'value':100,'valueType':'ice','isStone':false},{'name':'Insect Plate','id':106,'value':100,'valueType':'bug','isStone':false},{'name':'Iron Plate','id':107,'value':100,'valueType':'steel','isStone':false},{'name':'Meadow Plate','id':108,'value':100,'valueType':'grass','isStone':false},{'name':'Mind Plate','id':109,'value':100,'valueType':'psychic','isStone':false},{'name':'Sky Plate','id':110,'value':100,'valueType':'flying','isStone':false},{'name':'Splash Plate','id':111,'value':100,'valueType':'water','isStone':false},{'name':'Spooky Plate','id':112,'value':100,'valueType':'ghost','isStone':false},{'name':'Stone Plate','id':113,'value':100,'valueType':'rock','isStone':false},{'name':'Toxic Plate','id':114,'value':100,'valueType':'poison','isStone':false},{'name':'Zap Plate','id':115,'value':100,'valueType':'electric','isStone':false},{'name':'Pixie Plate','id':116,'value':100,'valueType':'fairy','isStone':false},{'name':'Helix Fossil','id':200,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Dome Fossil','id':201,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Old Amber','id':202,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Root Fossil','id':203,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Claw Fossil','id':204,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Armor Fossil','id':205,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Skull Fossil','id':206,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Cover Fossil','id':207,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Plume Fossil','id':208,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Jaw Fossil','id':209,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Sail Fossil','id':210,'value':0,'valueType':'Mine Egg','isStone':false},{'name':'Fire Stone','id':300,'value':1,'valueType':'Fire_stone','isStone':true},{'name':'Water Stone','id':301,'value':1,'valueType':'Water_stone','isStone':true},{'name':'Thunder Stone','id':302,'value':1,'valueType':'Thunder_stone','isStone':true},{'name':'Leaf Stone','id':303,'value':1,'valueType':'Leaf_stone','isStone':true},{'name':'Moon Stone','id':304,'value':1,'valueType':'Moon_stone','isStone':true},{'name':'Sun Stone','id':305,'value':1,'valueType':'Sun_stone','isStone':true}]};

module.exports = {
  pokemonTypeIcons,
  findGemBestRoute,
  findGemRoutes,
  SeededRand,
  DailyDeal,
  UndergroundItem,
};
