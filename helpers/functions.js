const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const https = require('https');
const { error } = require('./logging');
const { formatSecondsFullLetters } = require('./conversion');
const { GameConstants, pokemonList } = require('./pokeclicker');
const { website } = require('../config.js');

const postPages = async (interaction, pages, page = 1, msgEdit = false) => {
  const updateButtons = async (i, editPost = true) => {
    const prev = buttons.components.find(b => b.label == 'Prev');
    if (page <= 0) {
      prev.disabled = true;
      if (editPost) await i.editReply({ components: [buttons] });
    } else {
      prev.disabled = false;
      if (editPost) await i.editReply({ components: [buttons] });
    }
    const next = buttons.components.find(b => b.label == 'Next');
    if (page >= pages.length - 1) {
      next.disabled = true;
      if (editPost) await i.editReply({ components: [buttons] });
    } else {
      next.disabled = false;
      if (editPost) await i.editReply({ components: [buttons] });
    }
  };

  // page number should be 1 lower than expected for array
  page = Math.max(1, Math.min(pages.length, page)) - 1;
  const customID = randomString(6);

  // Send the default page
  await interaction.reply(msgEdit ? 'Loading...' : pages[page]);
  if (msgEdit) await interaction.editReply(pages[page]);

  // Don't add the reactions if only 1 page
  if (pages.length <= 1) return;

  const buttons = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId(`prev${customID}`)
        .setLabel('Prev')
        .setStyle('SECONDARY')
        .setEmoji('⬅'),
      new MessageButton()
        .setCustomId(`next${customID}`)
        .setLabel('Next')
        .setStyle('SECONDARY')
        .setEmoji('➡')
    );

  updateButtons(interaction);

  // Filters
  const backwardsFilter = (i) => i.customId === `prev${customID}` && i.user.id === interaction.user.id;
  const forwardsFilter = (i) => i.customId === `next${customID}` && i.user.id === interaction.user.id;

  // Allow reactions for up to x ms
  const timer = 2e5; // (200 seconds)
  const backwards = interaction.channel.createMessageComponentCollector({filter: backwardsFilter, time: timer});
  const forwards = interaction.channel.createMessageComponentCollector({filter: forwardsFilter, time: timer});

  backwards.on('collect', async i => {
    page = page <= 0 ? 0 : --page;
    await i.deferUpdate();
    updateButtons(i, false);
    await i.editReply({...pages[page], ...{components: [buttons]}});
  });

  forwards.on('collect', async i => {
    page = page >= pages.length - 1 ? pages.length - 1 : ++page;
    await i.deferUpdate();
    updateButtons(i, false);
    await i.editReply({...pages[page], ...{components: [buttons]}});
  });

  // Clear all the reactions once we aren't listening
  backwards.on('end', () => interaction.editReply({ components: [] }).catch(O_o=>{}));

  return buttons;
};

const upperCaseFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

const humanifyString = string => string.replace(/_/g, ' ');

const randomFromArray = arr => arr[Math.floor(Math.random() * arr.length)];

const addOrderedReactions = async (message, reactions) => {
  const addReaction = (reaction, cb) =>{
    setTimeout(async () => {
      await message.react(reaction).catch(O_o=>{});
      cb();
    }, 100);
  };

  reactions.reduce((promiseChain, reaction) => promiseChain.then(() => new Promise((resolve) => {
    addReaction(reaction, resolve);
  })), Promise.resolve());
};

const randomString = (length = 6) => {
  let str = '';
  while(str.length < length) {
    str += Math.random().toString(36).substring(2);
  }
  return str.substring(0, length);
};

const saveFileFlags = (saveData) => {
  const flags = [];
  // If Time Traveller flag
  if (saveData.player?._timeTraveller) {
    flags.push('Time Traveller');
  }
  // If Discord ID is invalid
  if (saveData.save?.discord?.ID && saveData.save?.discord?.ID.length < 17) {
    flags.push('Discord');
  }
  // Check if the player has more than 3 oak items active
  if (Object.values(saveData.save?.oakItems || {}).filter(i => i.isActive).length > 3) {
    flags.push('Oak Items');
  }
  // If more than 100 million of an item
  if (Math.max(...Object.values(saveData.player?._itemList || {})) > 1e8) {
    flags.push('Items');
  }
  // If more than 100 million of any underground items
  if (Math.max(...saveData.player?.mineInventory?.map(i => i.amount) || []) > 1e8) {
    flags.push('Underground Items');
  }
  // If more than 10 billion pokeballs
  if (Math.max(...saveData.save?.pokeballs?.pokeballs || []) > 1e10) {
    flags.push('Pokeballs');
  }
  // More gems than gems gained
  const gemsCheck = saveData.save?.statistics?.gemsGained?.some((v, i) => (saveData.save?.gems?.gemWallet?.[i] || 0) > v);
  if (gemsCheck) {
    flags.push('Gems');
  }
  // A ton of dungeons cleared very fast
  const dungeonSeconds = (saveData.save?.statistics?.secondsPlayed || 1) / (saveData.save?.statistics?.dungeonsCleared?.reduce((s, v) => s + v, 0) || 1);
  if (dungeonSeconds < 30) {
    flags.push(`Dungeons (${dungeonSeconds.toFixed(0)}s)`);
  }
  return flags;
};

const processSaveFile = (msg, file) => {
  https.get(file.url, (res) => {
    let body = '';
  
    // A chunk of data has been received.
    res.on('data', (chunk) => {
      body += chunk;
    });
  
    // The whole response has been received.
    res.on('end', () => {
      try {
        // Convert save file to JSON
        const saveData = JSON.parse(Buffer.from(body, 'base64').toString());

        // Gather data from the save file
        const timePlayed = saveData.save?.statistics?.secondsPlayed || 0;
        // Don't process save files with no time played
        if (!timePlayed) {
          return;
        }
        const saveFlags = saveFileFlags(saveData);
        const _lastSeen = saveData.player?._lastSeen || '0';
        const version = saveData.save?.update?.version || '0.0.0';
        const name = decodeURIComponent(saveData.save?.profile?.name || 'Trainer');
        const trainer = saveData.save?.profile?.trainer || 0;
        const pokemon = saveData.save?.profile?.pokemon || 0;
        const pokemonShiny = saveData.save?.profile?.pokemonShiny || false;
        const caughtPokemon = saveData.save?.party?.caughtPokemon?.length || 0;
        const caughtPokemonShiny = saveData.save?.party?.caughtPokemon?.filter(p => p[5])?.length || 0;
        const discordID = saveData.save?.discord?.ID || false;
        const challengesTotal = Object.values(saveData.save?.challenges?.list || {}).length || 0;
        const challengesEnabled = Object.values(saveData.save?.challenges?.list || {}).filter(a=>a).length || 0;
        const maxDungeons = saveData.save?.statistics?.dungeonsCleared
          ?.map((amt, i) => ({ name: GameConstants.RegionDungeons.flat()[i] || 'Unknown', amt }))
          ?.sort((a,b) => b.amt - a.amt)
          ?.slice(0, 5) || [];
        const maxPokemon = Object.entries(saveData.save?.statistics?.pokemonDefeated || {})
          ?.map(([id, amt]) => ({ name: pokemonList.find(p => p.id == +id)?.name || 'Unknown', amt }))
          ?.sort((a,b) => b.amt - a.amt)
          ?.slice(0, 5) || [];

        // Create the embed
        const embed = new MessageEmbed()
          .setAuthor({
            name: name,
            iconURL: `${website}assets/images/profile/trainer-${trainer}.png`,
          })
          .setColor('RANDOM')
          .setThumbnail(`${website}assets/images/${pokemonShiny ? 'shiny' : ''}pokemon/${pokemon}.png`)
          .addField('Discord:', discordID ? `<@${discordID}>` : 'False')
          .addField('Pokemon Caught:', `${caughtPokemon} | ${caughtPokemonShiny} ✨`)
          .addField('Time Played:', formatSecondsFullLetters(timePlayed))
          .addField('Challenges:', `${challengesEnabled}/${challengesTotal}`)
          .addField('Dungeon Clears:', maxDungeons.map(d => `${d.name}: ${d.amt.toLocaleString('en-US')}`).join('\n') || 'Null')
          .addField('Pokemon Defeated:', maxPokemon.map(d => `${d.name}: ${d.amt.toLocaleString('en-US')}`).join('\n') || 'Null')
          .addField('Save File:', `[Download](${file.url})`);

        if (saveFlags.length) {
          embed.addField('Flags:', `[⚠](${msg.url} "${saveFlags.join('\n')}")`);
        }

        embed.setFooter({ text: `Version: v${version} | Last Seen:` })
          .setTimestamp(_lastSeen);
        msg.reply({ embeds: [embed] });
      } catch (e) {
        error('Failed to process save file..\n', msg.url, '\n', e);
      }
    });
  }).on('error', error => {
    console.error(error);
  });
};

module.exports = {
  postPages,
  upperCaseFirstLetter,
  humanifyString,
  randomFromArray,
  addOrderedReactions,
  randomString,
  processSaveFile,
};
