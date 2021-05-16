const { getOldReminders, clearReminders } = require('../../database.js');
const { warn } = require('../../helpers.js');

const sendReminders = async (client) => {
  const reminders = await getOldReminders();
  reminders.forEach(r => {
    client.users.fetch(r.user, false).then((user) => {
      // Try send the user a DM with the reminder
      try {
        user.send(r.message);
      } catch(err) {
        warn('Could not send user DM with reminder:', r, err);
      } // User doesn't have DMs enabled, or something else went wrong
    }).catch(O_o=>{});

    // Clear the reminders we have just sent out
    clearReminders(reminders.map(r => r.id));
  });
};

module.exports = {
  sendReminders,
};
