const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const FuzzySet = require('fuzzyset');
const { wikiWebsite } = require('../config.js');
const { pokemonList, wikiLinks } = require('../helpers.js');

const fuzzyPokemon = FuzzySet(pokemonList.map(p => p.name.toLowerCase()), false);

module.exports = {
  name        : 'pokemon',
  aliases     : ['p', 'poke', 'pinfo', 'pokeinfo'],
  description : 'Get the PokéClicker wiki page for a specific Pokémon',
  args        : [
    {
      name: 'name-id',
      type: ApplicationCommandOptionType.String,
      description: 'Name or Pokédex ID of the Pokémon',
      required: true,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const input = interaction.options.get('name-id').value.trim().toLowerCase();
    let pokemon = pokemonList.find(p => p.id == +input || p.name.toLowerCase() == input);

    if (!pokemon && isNaN(input)) {
      const matches = fuzzyPokemon.get(input);
      if (matches) {
        pokemon = pokemonList.find(p => p.name.toLowerCase() == matches[0][1]);

        // Prefer the base Pokémon when an alternate form was matched from a
        // single-word query.
        if (!Number.isInteger(pokemon.id) && !input.includes(' ')) {
          pokemon = pokemonList.find(p => p.id == Math.floor(pokemon.id)) || pokemon;
        }
      }
    }

    if (!pokemon) pokemon = pokemonList.find(p => p.id == 0);
    if (!pokemon) return;

    const wikiLink = wikiLinks.find(link => link.type == 'Pokémon' && link.page == pokemon.name);
    const display = wikiLink?.display || pokemon.name;
    const url = `${wikiWebsite}#!${encodeURI(`Pokémon/${pokemon.name}`)}`;
    const embed = new EmbedBuilder()
      .setTitle('PokéClicker wiki')
      .setDescription(`**[${display}](${url})**`)
      .setColor('#3498db');
    interaction.reply({ embeds: [embed] });
  },
};
