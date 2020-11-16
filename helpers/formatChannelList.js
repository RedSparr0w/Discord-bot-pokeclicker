const { Collection } = require('discord.js');

const getAvailableChannelList = (guild, channels = true) => {
  // All channels are allowed
  if (channels === true) return true;
  // Restricted commands
  if (channels.length === 0) return new Collection();
  // Find the available channels
  return guild.channels.cache
    // Find all allowed channels
    .filter((channel) => channels.includes(channel.name))
    // Sort by priority
    .sorted((a, b) => channels.indexOf(a.name) - channels.indexOf(b.name));
};

// Convert a list of channels into channels available in this guild
// ['bot-commands'] -> '#bot-commands'
// ['bot-commands', 'game-corner'] -> '#bot-commands or #game corner'
// ['bot-commands', 'game-corner', 'bragging'] -> '#bot-commands, #game-corner, or #bragging'
const formatChannelList = (guild, channels) => {
  const availableChannels = getAvailableChannelList(guild, channels);
  if (availableChannels === true) return 'any channel';

  // Turn the list into a human-readable string
  return availableChannels.reduce((acc, next, key, arr) => {
    let joiner = '';
    // If we're not looking at the first item, set the joiner
    if (acc) {
      joiner = ', ';
      // If we're looking at the last item, determine if we should use a comma
      if (key === arr.lastKey()) {
        joiner = arr.size === 2 ? ' or ' : ', or ';
      }
    }
    return `${acc}${joiner}${next}`;
  }, '') || '#restricted-channel';
};

module.exports = {
  getAvailableChannelList,
  formatChannelList,
};
