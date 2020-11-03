/*jshint esversion: 6 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const config = MWDB.config;
const hooks = MWDB.hooks;
const func = require('../modules/functions.js');
const embed = require('../modules/embed.js');
const youtubedl = require('youtube-dl');
const path = require('path');
const fs = require('fs');
const pretty = require('prettysize');
const moment = require('moment');
const slugify = require('slugify')

const cPath = path.resolve('/usr/local/bin/youtube-dl')
youtubedl.setYtdlBinary(cPath)

let arguments = {
    'url': {
        required: true,
    }
};

MWDB.registerCommand('suggest', 'default', (message, bot, args, placeholder) => {
    let input = func.validate(arguments, args);

    // Handle errors if any
    if (Object.entries(input.errors).length !== 0) {
        let message = '> ' + config.prefix + ' recent ' + args.join(' ') + '\n';
        for (let argName in input.errors) {
            if (!input.errors.hasOwnProperty(argName)) {
                continue;
            }

            message = message + '\n' + argName.toUpperCase() + ': ' + input.errors[argName];
        }
        embed.error(null, placeholder, message, 'Incorrect command usage', 'suggest');
        return false;
    }

    message.delete();
    let start = moment();
    try {
        youtubedl.getInfo(input.processed.url, [], (err, info) => {
            if (err) {
                embed.error(null, placeholder, 'Error (001) while downloading the video, please try again... (full error logged to console)', 'Something went wrong', 'suggest');
                throw err;
            }
            console.log('[DEBUG] Video \'' + info.title + '\' found.');

            // Build (temp) filename
            let filename = slugify(info.title, {
                lower: true,      // convert to lower case, defaults to `false`
                strict: true,     // strip special characters except replacement, defaults to `false`
            });

            embed.ytdl(message, placeholder, info, 'Downloading...')

            youtubedl.exec(input.processed.url, ['-x', '--extract-audio', '--audio-format', 'mp3', '--output', '' + filename + '.%(ext)s'], {}, function (err, output) {
                if (err) {
                    embed.error(null, placeholder, 'Error (002) while downloading the video, please try again... (full error logged to console)', 'Something went wrong', 'suggest');
                    throw err;
                }
                // Video downloaded and converted to mp3
                console.log('[DEBUG] ' + input.processed.url + ' downloaded & converted to mp3');

                fs.rename(filename + '.mp3', config.path.mp3 + '/' + filename + '.mp3', (err) => {
                    if (err) {
                        embed.error(null, placeholder, 'Error (003) while downloading the video, please try again... (full error logged to console)', 'Something went wrong', 'suggest');
                        throw err;
                    }
                    // Video moved to destination folder
                    let returnedEmbed = embed.ytdl(message, placeholder, info, 'Downloaded!', config.url + '/storage/mp3/' + filename + '.mp3');
                    hooks.suggestions.send('', returnedEmbed);
                    // embed.normal(placeholder, 'success', 'Downloaded\n\n**File:** ' + config.url + '/storage/mp3/' + filename + '.mp3\n**Duration:** ' + moment.duration(moment().diff(start)).asSeconds() + 'sec\n\n**Videosize:** ' + numeral(info.filesize).format('0.00b') + '\n**Views:** ' + numeral(info.view_count).format('0a') + '\n**File:** ' + filename + '.mp3', info.title)

                    console.log('[DEBUG] ' + filename + '.mp3 moved to destination folder');
                });
            });
        })
    } catch (e) {
        console.log(e);
        embed.error(null, placeholder, 'Error (000) while downloading the video, please try again... (full error logged to console)', 'Something went wrong', 'suggest');
    }
}, ['add', 'send', 'download', 'dl'], 'Suggest a YouTube URL to the bot, the bot will then download an MP3 of the song and place it in the channel you launched this command in.', '<url>', ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
