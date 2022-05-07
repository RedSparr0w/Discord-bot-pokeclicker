const { MessageEmbed } = require('discord.js');
const { pauseClaimStreak, DAY } = require('../helpers.js');

module.exports = {
  name        : 'pause-claim',
  aliases     : [],
  description : 'Pause your daily or timely PokéCoin streaks for up to 14 days',
  args        : [],
  guildOnly   : true,
  cooldown    : 7 * DAY / 1000,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['game-corner', 'bot-commands'],
  execute     : async (interaction) => {
    await pauseClaimStreak(interaction.user);

    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor('RANDOM')
          .setDescription(`${interaction.user}\nI've paused your streaks for up to 14 days _(from the time of your last claim)_,\nWhen you next do a claim or timely it will be un-paused automatically.`),
      ],
    });
  },
};
