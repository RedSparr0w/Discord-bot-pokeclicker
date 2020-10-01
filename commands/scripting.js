const { MessageEmbed } = require('discord.js');
const { getAmount, removeAmount, getPurchased, addPurchased, setTrainerCard } = require('../database.js');
const { upperCaseFirstLetter, postPages, trainerCardColors, totalTrainerImages } = require('../helpers.js');
const imageBaseLink = 'https://raw.githubusercontent.com/RedSparr0w/Discord-bot-pokeclicker/master/assets/images';

const externalScriptsRoleID = '761015248856809493';
const reactionName = 'code';
const reactionID = '761083768614027265';

module.exports = {
  name        : 'scripting',
  aliases     : [],
  description : `Add the <@&${externalScriptsRoleID}>role to your account`,
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    
    const embed = new MessageEmbed()
      .setDescription([
        msg.author,
        '',
        `React to this message with <:${reactionName}:${reactionID}> to have the <@&${externalScriptsRoleID}>  role added to your account.`,
        '',
        '***Note:***',
        'You will not have access to the <#753062401837891615> channel after this,',
        '_(and possibly other channels in the future)_',
        'But you will gain access to the <#761024645997658124> channel.',
      ])
      .setColor('#3498db');

    const botMsg = await msg.channel.send({ embed });
    
    botMsg.react(reactionID);
    const reactFilter = (reaction, user) => reaction.emoji.id === reactionID && user.id === msg.author.id;
  
    // Allow reactions for up to x ms
    const timer = 6e4; // (60 seconds)
    const wantsRole = botMsg.createReactionCollector(reactFilter, {time: timer});

    wantsRole.on('collect', async r => {
      botMsg.reactions.removeAll().catch(O_o=>{});
      msg.member.roles.add(externalScriptsRoleID, 'User accepted scripter role');
      // Delete both messages
      msg.delete().catch(O_o=>{});
      botMsg.delete().catch(O_o=>{});

      embed.setDescription([
        '`@external scripts` Role successfully applied!',
        '',
        'You now have access to <#761024645997658124>',
        '',
        '**DO NOT** discuss any external scripts or inaccessible content in the public channels,',
        '**DO NOT** report any bugs that you encounter that may be related to external scripts in the <#698525808377069628> channel.',
        '',
        '***NOTE:***',
        '_Breaking any of the above rules may result in a server wide mute, kick or ban._',
        '_Please ensure you read the pinned message upon joining the channel._',
      ]);

      let error;
      await msg.author.send({ embed }).catch(e => error = e);
      if (error) {
        console.error('err');
      }
    });
  },
};
