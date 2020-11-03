/*jshint esversion: 9 */

const MWDB = require('../bot-shard.js');
const embed = require('../modules/embed.js');
const func = require('../modules/functions.js');
const settings = require('../modules/settings.js');
const bot = MWDB.bot;
const config = MWDB.config;
const commands = MWDB.commands;
const data = MWDB.data;
// let didYouMean = {
//     'pc': 'stats',
//     'xbox': 'stats',
//     'ps': 'stats',
//     'psn': 'stats',
//     'act': 'stats',
// };

bot.on('message', (message) => {
    let cmd = null;
    let cmdType = null;

    //  This is another bot speaking
    if (message.author.bot) {
        return;
    }

    // This is not a command we're interested in (no prefix)
    if (message.content.indexOf(config.prefix, 0) !== 0) {
        return;
    }

    let category = 'default';
    if (message.channel.type === 'dm') {
        category = 'pm';
    }

    // Put a placeholder while we load the returned information.
    console.log(message.author.username + '#' + message.author.discriminator + ': ' + message.content);

    message.channel.send(data.loadingmsgs[Math.floor(Math.random() * data.loadingmsgs.length)] + ' (processing, please wait...)').then((placeholder) => {
        let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        let command = args.shift().toLowerCase();

        if (command === '') {
            command = 'help';
        }

        let input = {
            command: null,
            type: null,
        };

        for (let cmd in commands[category]) {
            if (!commands[category].hasOwnProperty(cmd)) {
                continue;
            }

            // Check if command is main registered or is an alias
            if (command === cmd || commands[category][cmd].aliases.includes(command)) {
                input = {
                    command: cmd,
                    type: category,
                };
                break;
            }
        }

        if (input.command !== null && input.type !== null) {
            try {
                if (input.type === 'pm') {
                    if (message.author.id.toString() !== config.bot.owner) {
                        embed.error(null, placeholder, 'This bot doesn\'t work using private messages. **Use me in a server**.', 'No private messages allowed', null, 10);
                    } else {
                        commands[input.type][input.command].process(message, bot, args, placeholder);
                    }
                } else {
                    // Catch command sent in a channel that doesn't give the bot embed link permissions.

                    if (!message.guild.me.permissionsIn(message.channel).has('EMBED_LINKS')) {
                        placeholder.edit(':poop: The bot is missing the `EMBED_LINKS` permission **in this channel**. Without this permission it can\'t reply to your message.');
                        return;
                    }

                    commands[input.type][input.command].process(message, bot, args, placeholder);
                }
            } catch (error) {
                console.log('[ERROR] ' + error.stack);
            }
        } else {
            if (category === 'default') {
                // TODO: Evaluate the requirement of throwing a 'did you mean' help text when a command was used wrong
                embed.error(null, placeholder, 'We did not recognise this command, the available commands are as following:\n\n' + func.listUsages(true) + '\n\nType `!mw help` for more information.', 'Unknown command', null, 30);
            } else {
                embed.error(null, placeholder, 'We don\'t really process private messages for privacy reasons. Use me in a server!', 'Beep boop. I am but a dumb robot :robot:.', null, 10);
            }
        }
    });

    if (message.guild) {
        settings.get(message.guild.id, 'removeTriggerMessages').then((setting) => {
            // console.log('settings - remove trigger', setting);

            if (setting && message.guild.me.hasPermission('MANAGE_MESSAGES')) {
                message.delete({timeout: 1000, reason: config.name.short + ' according to the bot configuration the bot should remove the input commands.'}).catch((e) => {
                    console.log('[ERROR]' + e.stack);
                });
            }
        });
    }
});

