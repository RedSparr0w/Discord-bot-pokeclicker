const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { modLog } = require('../other/mod/functions.js');

module.exports = {
  name        : 'leave-beta',
  aliases     : [],
  description : 'Leave the @Beta Tester team',
  args        : [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'User to remove the role from (mod only)',
      required: false, // Optional, defaults to interaction user
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks', 'ManageRoles'],
  userroles   : ['Beta Tester', 'Moderator'], // Allow moderators to remove the role from others
  channels    : ['beta-general', 'bot-commands'],
  execute     : async (interaction, args) => {
    const id = interaction.options.get('user')?.value;

    let member = interaction.member;
    let user = interaction.user;



    if (id) {
      // Only allow moderators to remove the role from another user
      if (!interaction.member.roles.cache.some(r => r.name === 'Moderator')) {
        const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('You do not have permission to remove the role from another user.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      // Fetch the member by ID
      member = await interaction.guild.members.fetch(id).catch(e => {});
      if (!member) {
        const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Invalid user ID specified.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      user = member.user;
    }

    const role = member.guild.roles.cache.find(role => role.name === 'Beta Tester');

    if (!role) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('Beta Tester role not found,\ntry again later..');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (member.id === interaction.guild.members.me.id) {
      modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()} (${member.id})
      **Action:** Attempted to remove ${role} from the bot`);
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription('You cannot remove that role from me trainer!');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!member.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder().setColor('#e74c3c').setDescription(`${member} does not have the ${role} role.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await member.roles.remove(role, `Role removed by ${interaction.member.displayName}-${interaction.user.id}`);

    const embed = new EmbedBuilder().setColor('#3498db').setDescription(`${member}, you have left the ${role} team.`);

    modLog(interaction.guild,
      `**Mod:** ${interaction.member.toString()}
      **User:** ${member.toString()} (${member.id})
      **Action:** Removed ${role}`);

    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
