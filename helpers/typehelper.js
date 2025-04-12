const {
  GameConstants,
  PokemonType,
} = require('./pokeclicker.js');


function typeMatrix() {
  const imm = GameConstants.TypeEffectivenessValue.Immune;
  const not = GameConstants.TypeEffectivenessValue.NotVery;
  const neu = GameConstants.TypeEffectivenessValue.Neutral;
  const vry = GameConstants.TypeEffectivenessValue.Very;

  return [
    [neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, not, imm, neu, neu, not, neu],
    [neu, not, not, neu, vry, vry, neu, neu, neu, neu, neu, vry, not, neu, not, neu, vry, neu],
    [neu, vry, not, neu, not, neu, neu, neu, vry, neu, neu, neu, vry, neu, not, neu, neu, neu],
    [neu, neu, vry, not, not, neu, neu, neu, imm, vry, neu, neu, neu, neu, not, neu, neu, neu],
    [neu, not, vry, neu, not, neu, neu, not, vry, not, neu, not, vry, neu, not, neu, not, neu],
    [neu, not, not, neu, vry, not, neu, neu, vry, vry, neu, neu, neu, neu, vry, neu, not, neu],
    [vry, neu, neu, neu, neu, vry, neu, not, neu, not, not, not, vry, imm, neu, vry, vry, not],
    [neu, neu, neu, neu, vry, neu, neu, not, not, neu, neu, neu, not, not, neu, neu, imm, vry],
    [neu, vry, neu, vry, not, neu, neu, vry, neu, imm, neu, not, vry, neu, neu, neu, vry, neu],
    [neu, neu, neu, not, vry, neu, vry, neu, neu, neu, neu, vry, not, neu, neu, neu, not, neu],
    [neu, neu, neu, neu, neu, neu, vry, vry, neu, neu, not, neu, neu, neu, neu, imm, not, neu],
    [neu, not, neu, neu, vry, neu, not, not, neu, not, vry, neu, neu, not, neu, vry, not, not],
    [neu, vry, neu, neu, neu, vry, not, neu, not, vry, neu, vry, neu, neu, neu, neu, not, neu],
    [imm, neu, neu, neu, neu, neu, neu, neu, neu, neu, vry, neu, neu, vry, neu, not, neu, neu],
    [neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, neu, vry, neu, not, imm],
    [neu, neu, neu, neu, neu, neu, not, neu, neu, neu, vry, neu, neu, vry, neu, not, neu, not],
    [neu, not, not, not, neu, vry, neu, neu, neu, neu, neu, neu, vry, neu, neu, neu, not, vry],
    [neu, not, neu, neu, neu, neu, vry, not, neu, neu, neu, neu, neu, neu, vry, vry, not, neu],
  ];
}

function getAttackModifier(a1, a2, d1, d2) {
  // Early exit if attack or first defending type is None
  if (a1 === PokemonType.None || d1 === PokemonType.None) {
    return 1;
  }

  // Fallback to first type if second type is None

  a2 = (a2 !== PokemonType.None) ? a2 : a1;
  d2 = (d2 !== PokemonType.None) ? d2 : d1;
  const _typeMatrix = typeMatrix();

  const m1 = _typeMatrix[a1][d1];
  const m2 = _typeMatrix[a1][d2];
  const m3 = _typeMatrix[a2][d1];
  const m4 = _typeMatrix[a2][d2];

  // Return the larger of the two multipliers
  return Math.max(m1 * m2, m3 * m4);
}


module.exports = {
  getAttackModifier,
};
