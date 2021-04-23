# Pokéclicker Discord Bot

This is the code for the Pokéclicker Discord Bot. In order to run it locally for development, you must set up a [Discord Application](https://discord.com/developers/applications) with a bot token, and invite it to a server that you can manage.

Steps for running:

* Copy `_config.js` to `config.js` and change the settings
* Run `npm ci` to install dependencies
* Run `npm start` to start the server
* Open the invite link provided in the console, and add the bot to a server, then grant it a role with the permissions listed below

## Permissions

* Manage Roles - Allow the bot to assign and unassign roles with `!mute`, `!unmute`, and `!scripting`
* Read Text Channels & See Voice Channels
* Send Messages
* Manage Messages - Allow the bot to delete messages
* Embedded Links
* Attach files - Allow the bot to post database backups
* Mention `@everyone`, `@here` and All Roles
