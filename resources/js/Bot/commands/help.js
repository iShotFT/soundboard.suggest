/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const func = require('../modules/functions.js');
const config = MWDB.config;
const commands = MWDB.commands;

let arguments = {
    'here': {
        required: false,
        default: false,
    },
};

MWDB.registerCommand('help', 'default', (message, bot, args, placeholder) => {
    let input = func.validate(arguments, args);
    // Build a list of available commands
    let fields = {};
    let embed = new Discord.MessageEmbed()
        .setColor(MWDB.data.color.default)
        .setAuthor(config.name.full)
        .setTitle('Commands help')
        .setURL(config.url + '/?src=dsmsg');

    for (let type in commands) {
        if (!commands.hasOwnProperty(type)) {
            continue;
        }

        if (type === 'pm') {
            continue;
        }

        for (let mainCommand in commands[type]) {
            if (!commands[type].hasOwnProperty(mainCommand)) {
                continue;
            }


            // Build text for this command
            let text = '> *' + commands[type][mainCommand].description + '*\n';
            if (commands[type][mainCommand].usage !== null) {
                text = text + '> `' + config.prefix + ' ' + mainCommand + ' ' + commands[type][mainCommand].usage + '`\n';
            } else {
                text = text + '> `' + config.prefix + ' ' + mainCommand + '`\n';
            }
            if (commands[type][mainCommand].examples.length) {
                text = text + '> \n> Example(s):\n';
                for (let index in commands[type][mainCommand].examples) {
                    text = text + '> ' + config.prefix + ' ' + mainCommand + ' ' + commands[type][mainCommand].examples[index] + '\n';
                }
            }

            embed.addField('**:small_blue_diamond: ' + mainCommand.toUpperCase() + '**', text + '\n\n\n');
        }
    }

    // message.author.
    if (input.processed.here === 'here') {
        placeholder.edit('', embed);
        console.log('[INFO] Posted help message in the channel it was requested in.');
    } else {
        bot.users.cache.get(message.author.id.toString()).send('', embed)
            .then(placeholder => {
                console.log('[INFO] Sent help message to user ' + message.author.username);
            })
            .catch(error => {
                console.log('[ERROR] Failed to send a help message to user ' + message.author.username);
            });

        placeholder.edit('We have sent you a PM with some information about our commands <@' + message.author.id.toString() + '>');
    }

    return true;
}, ['hlp'], 'Receive some helpful information about this bot and it\'s usage. Add \'here\' at the end of the command to post the help message in the channel you posted the command in instead of sending it to you over PM.', '[\'here\']', ['', 'here']);
