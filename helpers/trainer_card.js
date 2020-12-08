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

const trainerCardBadges = [
  {
    name: 'Boulder',
    description: 'Purchase something in the profile shop',
    icon: '<:boulder_badge:785737861768151061>',
    // card stuff
    src: './assets/images/badges/0.png',
    left: 27,
    bottom: 11,
  },
  {
    name: 'Cascade',
    description: '-',
    icon: '<:cascade_badge:785737862166872064>',
    // card stuff
    src: './assets/images/badges/1.png',
    left: 53,
    bottom: 11,
  },
  {
    name: 'Thunder',
    description: '-',
    icon: '<:thunder_badge:785737862146555925>',
    // card stuff
    src: './assets/images/badges/2.png',
    left: 74,
    bottom: 10,
  },
  {
    name: 'Rainbow',
    description: 'Win over 5,000 coins in one game',
    icon: '<:rainbow_badge:785737862174736435>',
    // card stuff
    src: './assets/images/badges/3.png',
    left: 98,
    bottom: 10,
  },
  {
    name: 'Marsh',
    description: 'Play in the games corner 1000 times',
    icon: '<:marsh_badge:785737862280249364>',
    // card stuff
    src: './assets/images/badges/4.png',
    left: 123,
    bottom: 11,
  },
  {
    name: 'Soul',
    description: 'Reach a Balance of over 25,000',
    icon: '<:soul_badge:785737861981798481>',
    // card stuff
    src: './assets/images/badges/5.png',
    left: 147,
    bottom: 11,
  },
  {
    name: 'Volcano',
    description: 'Reach a Timely streak of over 500',
    icon: '<:volcano_badge:785737862196887612>',
    // card stuff
    src: './assets/images/badges/6.png',
    left: 171,
    bottom: 11,
  },
  {
    name: 'Earth',
    description: 'Reach a Daily streak of over 100',
    icon: '<:earth_badge:785737862385631312>',
    // card stuff
    src: './assets/images/badges/7.png',
    left: 194,
    bottom: 11,
  },
];

// highest trainer image ID 0 → X
const totalTrainerImages = 64;

module.exports = {
  trainerCardColors,
  trainerCardBadges,
  totalTrainerImages,
};
