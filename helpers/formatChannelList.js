// Convert a list of channels into channels available in this guild
// ['bot-commands'] -> '#bot-commands'
// ['bot-commands', 'game-corner'] -> '#bot-commands or #game corner'
// ['bot-commands', 'game-corner', 'bragging'] -> '#bot-commands, #game-corner, or #bragging'
const formatChannelList = (guild, channels) => guild.channels.cache
  // Find all allowed channels
  .filter((channel) => channels.includes(channel.name))
  // Sort by priority
  .sorted((a, b) => channels.indexOf(a.name) - channels.indexOf(b.name))
  // Turn the sorted list into a human-readable string
  .reduce((acc, next, key, arr) => {
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
  }, '');

module.exports = {
  formatChannelList,
};
