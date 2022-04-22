const { error } = require('../helpers.js');
const { ownerID } = require('../config.js');

module.exports = {
  name        : 'deploy',
  aliases     : [],
  description : 'Deploy new commands',
  args        : [],
  guildOnly   : true,
  cooldown    : 0.1,
  botperms    : ['SEND_MESSAGES'],
  userperms   : ['MANAGE_GUILD'],
  channels    : [], // default restricted channels
  execute     : async (msg, args) => {
    if (!ownerID || msg.author.id !== ownerID) return;
    try {
      console.log('Deploying new commands!');
      // Add our slash commands
      const data = msg.client.slashCommands.map(c => ({
        name: c.name,
        description: c.description,
        options: c.args,
        defaultPermission: (!c.userperms || c.userperms?.length == 0) && (!c.userroles || c.userroles?.length == 0),
      }));
      // Add any context menu commands
      data.push(...msg.client.slashCommands.filter(c => c.type).map(c => ({
        name: c.name,
        type: c.type,
        defaultPermission: (!c.userperms || c.userperms?.length == 0) && (!c.userroles || c.userroles?.length == 0),
      })));
      // Update the current list of commands for this guild
      await msg.guild.commands.set(data);

      const restrictCmds = msg.client.slashCommands
        .filter(c => c.userperms?.length > 0 || c.userroles?.length > 0)
        .map(c => {
          const roleIDs = msg.guild.roles.cache.filter(r => {
            let canUse = true;
            if (c.userperms?.length) {
              if (!r.permissions.has(c.userperms)) {
                canUse = false;
              }
            }
            if (c.userroles?.length) {
              if (!c.userroles.includes(r.id) && !c.userroles.includes(r.name)) {
                canUse = false;
              }
            }
            return canUse;
          }).map(r => r.id);
          c.roleIDs = roleIDs;
          return c;
        });

      const fullPermissions = msg.guild.commands.cache.filter(c => restrictCmds.find(cmd => cmd.name === c.name)).map(c => {
        const cmd = restrictCmds.find(cmd => cmd.name === c.name);
        return {
          id: c.id,
          permissions: cmd.roleIDs.map(r => ({
            id: r,
            type: 'ROLE',
            permission: true,
          })),
        };
      });
      const output = msg.guild.commands.cache.filter(c => restrictCmds.find(cmd => cmd.name === c.name)).map(c => {
        const cmd = restrictCmds.find(cmd => cmd.name === c.name);
        return `/${c.name}\n${cmd.roleIDs.map(r => `<@&${r}>`).join('\n')}`;
      });

      // Update the permissions for these commands
      await msg.client.guilds.cache.get(msg.guild.id.toString()).commands.permissions.set({ fullPermissions });
      msg.reply(`Updated guild commands!\n\`\`\`yaml\nCommands: ${data.length}\nRestricted: ${fullPermissions.length}\n\`\`\`\n${output.join('\n')}`);

    } catch (e) {
      error('Unable to deploy new commands:\n', e);
    }
    return;
  },
};
