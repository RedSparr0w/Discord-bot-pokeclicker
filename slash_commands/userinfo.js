const { MessageEmbed } = require('discord.js');

module.exports = {
  type        : 'USER',
  name        : 'userinfo',
  aliases     : [],
  description : 'Get a members server info',
  args        : [
    {
      name: 'user',
      type: 'USER',
      description: 'Get another users trainer card',
      required: false,
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['MUTE_MEMBERS'],
  execute     : async (interaction) => {
    const id = interaction.options.get('user')?.value;

    let member = interaction.member;
    let user = interaction.user;

    if (id) {
      member = await interaction.guild.members.fetch(id).catch(e => {});
      if (!member) {
        const embed = new MessageEmbed().setColor('#e74c3c').setDescription('Invalid user ID specified.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      user = member.user;
    }

    const joinDiscord = new Date(user.createdTimestamp);
    const joinServer = new Date(member.joinedTimestamp);
    const embed = new MessageEmbed()
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

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
