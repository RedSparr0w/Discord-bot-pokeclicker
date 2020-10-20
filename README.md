# Pokéclicker Discord Bot

This is the code for the Pokéclicker Discord Bot. In order to run it locally for development, you must set up a [Discord Application](https://discord.com/developers/applications) with a bot token, and invite it to a server that you can manage.

Steps for running:

* Copy `_config.json` to `config.json` and change the settings
* Run `npm ci` to install dependencies
* Run `npm start` to start the server
* Open the invite link provided in the console, and add the bot to a server, then grant it a role with the permissions listed below

## Permissions

* `ATTACH_FILES` - Attach Files - Used for `!backup`
* `DELETE_MESSAGE` - Manage Messages - Used for `!post`
* `SEND_MESSAGES` - Used for all
* `EMBED_LINKS` - Used for all
