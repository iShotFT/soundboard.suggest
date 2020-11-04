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
const moment = require('moment');
const slugify = require('slugify');

const cPath = path.resolve('/usr/local/bin/youtube-dl')
youtubedl.setYtdlBinary(cPath)

let arguments = {
    'url': {
        required: true,
    }
};

MWDB.registerCommand('download', 'default', (message, bot, args, placeholder) => {
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
        youtubedl.getInfo(input.processed.url, ['-f', 'bestaudio'], (err, info) => {
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

            youtubedl.exec(input.processed.url, ['-f', 'bestaudio', '-x', '--extract-audio', '--audio-format', 'mp3', '--output', '' + filename + '.%(ext)s'], {}, function (err, output) {
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
                    let returnedEmbed = embed.ytdl(message, placeholder, info, 'Downloaded in ' + moment.duration(moment().diff(start)).humanize() + '!', config.url + '/storage/mp3/' + filename + '.mp3');

                    console.log('[DEBUG] ' + filename + '.mp3 moved to destination folder');
                });
            });
        })
    } catch (e) {
        console.log(e);
        embed.error(null, placeholder, 'Error (000) while downloading the video, please try again... (full error logged to console)', 'Something went wrong', 'suggest');
    }
}, ['dl', 'down', 'save'], 'Simply download a YouTube URL using the bot (without suggesting it to the bot owner), the bot will then download an MP3 of the song and place it in the channel you launched this command in. By default we\'ll always attempt to download the best audio quality available.', '<url>', ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
