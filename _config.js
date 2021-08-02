module.exports = {
  prefix: '!',
  token: 'YOUR_BOTS_TOKEN_HERE',
  // Image source website base
  website: 'https://LINK.TO.WEBSITE/',
  // Bot owner ID, used for eval and other commands
  ownerID: 'YOUR_DISCORD_USER_ID (optional)',
  // Channel where the backup database should be sent
  backupChannelID: 'DISCORD_BACKUP_CHANNEL_ID (optional)',
  quizChannelID: 'DISCORD_QUIZ_CHANNEL_ID (optional)',
  // Specific roles in the server
  mutedRoleID: '758167963294629898',
  externalScriptsRoleID: '761015248856809493',
  autoReminerRoleID: '871624019005292564',
  // Roles that get bonus coins (percentage gain)
  bonusRoles: {
    '642082374515163176': 0.2, // Poké Squad (alt)
    '751979566280605728': 0.2, // Poké Squad
    '736262806306947215': 0.5, // Server Booster
  },
  notificationRoles: {
    // Role ID: Reaction
    '787144169176825856': '<:Pokeball:662909508284055553>', // Game Updates
    '787144107817959444': '<:money:751765172523106377>', // Bot Updates
    '788190728027242496': '<:marsh_badge:785737862280249364>', // Happy Hour
    '871624019005292564': '<:star_ping:871628714386006056>', // Auto Reminder
  },
  serverIcons: {
    money: '<:money:737206931759824918>',
  },
};
