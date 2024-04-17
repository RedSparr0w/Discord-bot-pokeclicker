const trainerCardColors = [
  'blue',
  'purple',
  'pink',
  'red',
  'green',
  'bronze',
  'silver',
  'gold',
];

const trainerCardBadgeTypes = {
  Boulder: 0,
  Cascade: 1,
  Thunder: 2,
  Rainbow: 3,
  Marsh: 4,
  Soul: 5,
  Volcano: 6,
  Earth: 7,
};

const trainerCardBadges = [
  { // 0
    name: 'Boulder',
    description: 'Purchase something in the profile shop',
    icon: '<:boulder_badge:785737861768151061>',
    // card stuff
    src: './assets/images/badges/0.png',
    left: 27,
    top: 123,
  },
  { // 1
    name: 'Cascade',
    description: 'Use the bot commands 1,000 times',
    icon: '<:cascade_badge:785737862166872064>',
    // card stuff
    src: './assets/images/badges/1.png',
    left: 53,
    top: 123,
  },
  { // 2
    name: 'Thunder',
    description: 'Send 2,500 messages in the server\n(30s cooldown between messages)',
    icon: '<:thunder_badge:785737862146555925>',
    // card stuff
    src: './assets/images/badges/2.png',
    left: 74,
    top: 122,
  },
  { // 3
    name: 'Rainbow',
    description: 'Win a net profit of 5,000 coins or more in one game',
    icon: '<:rainbow_badge:785737862174736435>',
    // card stuff
    src: './assets/images/badges/3.png',
    left: 98,
    top: 122,
  },
  { // 4
    name: 'Marsh',
    description: 'Play in the games corner 1,000 times\n-OR-\nAnswer 100 questions in the bot-coins channel',
    icon: '<:marsh_badge:785737862280249364>',
    // card stuff
    src: './assets/images/badges/4.png',
    left: 123,
    top: 123,
  },
  { // 5
    name: 'Soul',
    description: 'Reach a Balance of over 25,000',
    icon: '<:soul_badge:785737861981798481>',
    // card stuff
    src: './assets/images/badges/5.png',
    left: 147,
    top: 123,
  },
  { // 6
    name: 'Volcano',
    description: 'Reach a Timely streak of over 500',
    icon: '<:volcano_badge:785737862196887612>',
    // card stuff
    src: './assets/images/badges/6.png',
    left: 171,
    top: 122,
  },
  { // 7
    name: 'Earth',
    description: 'Reach a Daily streak of over 100',
    icon: '<:earth_badge:785737862385631312>',
    // card stuff
    src: './assets/images/badges/7.png',
    left: 194,
    top: 122,
  },
];

// highest trainer image ID 0 → X
const totalTrainerImages = 64;

module.exports = {
  trainerCardColors,
  trainerCardBadgeTypes,
  trainerCardBadges,
  totalTrainerImages,
};
