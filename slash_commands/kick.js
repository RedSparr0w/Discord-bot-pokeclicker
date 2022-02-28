const { MessageEmbed } = require('discord.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'kick',
  aliases     : [],
  description : 'Kick a member from the Discord',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'The user to be kicked',
      required: true,
    },
    {
      name: 'reason',
      type: 'STRING',
      description: 'The reason this user is being kicked',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 30,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS'],
  userperms   : ['MUTE_MEMBERS'],
  execute     : async (interaction) => {
    const id = interaction.options.get('user').value;
    const reason = interaction.options.get('reason')?.value;

    const member = await interaction.guild.members.fetch(id).catch(e => {});
    if (!member) {
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('Invalid user ID specified.');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member == interaction.guild.me) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to kick the bot
        **Reason:** ${reason || 'Unknown'}`);
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('You cannot kick me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      modLog(interaction.guild,
        `**Mod:** ${interaction.member.toString()}
        **User:** ${member.toString()}
        **Action:** Attempted to kick user (failed as higher roles)
        **Reason:** ${reason || 'Unknown'}`);
      const embed = new MessageEmbed().setColor('#e74c3c').setDescription('The user you tried to kick has higher or equal roles than you!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = member.user;

    const joinDiscord = new Date(user.createdTimestamp);
    const joinServer = new Date(member.joinedTimestamp);
    const embed = new MessageEmbed()
      .setTitle('USER KICKED')
      .setAuthor(user.tag, user.displayAvatarURL())
      .setDescription(user.toString())
      .setColor('RANDOM')
      .setThumbnail(user.displayAvatarURL())
      .addField('Status:', member?.presence?.status || 'offline')
      .addField('Joined Discord:', `<t:${Math.floor(+joinDiscord / 1000)}:R>`)
      .addField('Joined Server:', `<t:${Math.floor(+joinServer / 1000)}:R>`)
      .addField('Roles:', member?.roles?.cache?.map(r => `${r}`)?.join('\n') || 'unknown')
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();

    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()}
      **Action:** User Kicked
      **Reason:** ${reason || 'Unknown'}`);

    interaction.reply({ embeds: [embed], ephemeral: true });
    member.kick(reason || 'Unknown');
  },
};
