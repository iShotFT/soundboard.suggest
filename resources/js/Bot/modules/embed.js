/*jshint esversion: 9 */

const Discord = require('discord.js');
const moment = require('moment');
const MWDB = require('../bot-shard.js');
const func = require('../modules/functions.js');
const hook = require('../modules/hooks.js');
const api = require('../actions/apicall');
const numeral = require('numeral');
const bot = MWDB.bot;
const config = MWDB.config;
const colors = MWDB.data.color;
const properties = MWDB.data.properties;
const gamemodes = MWDB.data.gamemodes;
const gametypes = MWDB.data.gametypes;
const weapons = MWDB.data.weapons;
const maps = MWDB.data.maps;


let error = (error, placeholder, message, title = null, command = null, timeout = 30, url = null) => {
    if (error === null) {
        console.log('[ERROR] ' + message.replace(/(\r\n|\n|\r)/gm, ' '));
    } else if (error.response && error.response.data && error.response.data.message) {
        console.log('[ERROR] ' + error.response.data.message.replace(/(\r\n|\n|\r)/gm, ' '));
    } else {
        console.log('[ERROR] A full error stack was triggered:\n' + error.stack);

        // Send error to error channel on Discord
        let embed = new Discord.MessageEmbed()
            .setTitle(error.name.substring(0, 256))
            .addField('Guild', placeholder.guild ? placeholder.guild.name : 'Unknown')
            .addField('Channel', placeholder.channel ? placeholder.channel.name : 'Unknown')
            .addField('Error', '```shell\n' + error.stack.substring(0, 1000) + '```');
        hook.send('error', ':warning: A full error stack was triggered on the bot side', embed);
    }

    if (command !== null && MWDB.commands.default[command]) {
        // message = message + '\n\n**Command usage:** ' \n\n*For more information about this command, type `' + config.prefix + ' help ' + command + '`\n or visit our :book: documentation website: ' + config.url + '/public/docs*\n';
        message = message + '\n\n**Command usage:**\n`' + config.prefix + ' ' + command + ' ' + MWDB.commands.default[command].usage + '`';
    }

    let icon = '「:poop:」';

    if (title === 'Premium required') {
        icon = '「:star:」';
    }

    let embed = new Discord.MessageEmbed();
    embed.setColor(colors.danger)
        .setTitle(icon + (title !== null ? title : 'Something went wrong.'))
        .setDescription(message)
        .setTimestamp();

    if (timeout > 0) {
        embed.setFooter('This message will remove itself after ~' + timeout + ' seconds.');
    }

    if (url !== null) {
        embed.setURL(url);
    }

    placeholder.edit('', embed).then(placeholder => {
        if (timeout > 0) {
            placeholder.delete({
                timeout: timeout * 1000,
                reason: config.name.short + ' removes errors after a while to keep your channels clean'
            }).catch((e) => {
            });
        }
    }).catch((e) => {
        console.log(e);
    });

    return embed;
};
exports.error = error;

let ytdl = (message, placeholder, ytinfo, description, finished = false) => {
    // console.log('Normal embed');
    let embed = new Discord.MessageEmbed();
    embed.setColor(finished !== false ? colors.success : colors.warning)
        .setTitle(ytinfo.title)
        .setDescription(description);

    // Youtube URL
    embed.addField('URL', ytinfo.webpage_url, false);

    // Requested by
    embed.addField('Requested by', '<@' + message.author.id + '>', false);

    // Empty row
    // embed.addField('‎', '‎', false);
    // \n\n**URL**: ' + info.webpage_url + '\n**Suggested by**: <@' + message.author.id + '>\n\n**Length:** ' + info._duration_hms + '\n**Videosize:** ' +  + '\n**Views:** ' + numeral(info.view_count).format('0a') + '\n**File:** ' + filename + '.mp3'

    // Extra video information
    embed.addField('Video size', numeral(ytinfo.filesize).format('0.00b'), true);
    embed.addField('Playtime', ytinfo._duration_hms, true);
    embed.addField('Uploader', ytinfo.uploader, true);

    embed.addField('Views', numeral(ytinfo.view_count).format('0a'), true);
    embed.addField('Uploaded at', ytinfo.upload_date, true);
    embed.addField('Format', 'Best audio', true);

    if (finished !== false) {
        // Download URL if finished !== false
        embed.addField(':arrow_down_small: Download', finished, false);
    }

    // Thumbnail
    if (ytinfo.thumbnails.length && ytinfo.thumbnails[0] !== undefined) {
        embed.setThumbnail(ytinfo.thumbnails[0].url);
    }


    if (placeholder !== null) {
        embed.setFooter('This bot was made with ❤ by iShot#5449');
        placeholder.edit('', embed);
    } else {
        embed.setFooter('This bot was made with ❤ by iShot#5449');
    }

    return embed;
};
exports.ytdl = ytdl;

let normal = (placeholder, color, message, title, command = null, timeout = false, compact = false, url = null) => {
    // console.log('Normal embed');
    let embed = new Discord.MessageEmbed();
    embed.setColor(colors[color])
        .setTitle(title)
        .setDescription(message);

    if (url !== null) {
        embed.setURL(url);
    }


    if (compact === false) {
        embed.setAuthor(config.name.full)
            .setTimestamp();
    }

    if (placeholder !== null) {
        if (timeout) {
            if (compact === false) {
                embed.setFooter('This message will delete itself in ' + timeout.toString() + ' seconds.');
            }

            placeholder.edit('', embed).then(placeholder => {
                placeholder.delete({
                    timeout: timeout * 1000,
                    reason: config.name.short + ' removes errors after a while to keep your channels clean'
                }).catch((e) => {
                });
            }).catch((e) => {
            });
        } else {
            if (compact === false) {
                embed.setFooter('This bot was made with ❤ by iShot#5449');
            }

            placeholder.edit('', embed);
        }
    } else {
        if (compact === false) {
            embed.setFooter('This bot was made with ❤ by iShot#5449');
        }
    }

    return embed;
};
exports.normal = normal;

let rolechanges = (placeholder, member, changes, title = null) => {
    let assigned = parseInt(Object.keys(changes.assign).length);
    let removed = parseInt(Object.keys(changes.remove).length);
    let amount = assigned + removed;

    let embed = new Discord.MessageEmbed();
    embed.setTitle(title === null ? (amount > 0 ? 'Discord roles synced' : 'No role changes required') : title)
        .setDescription('**Discord:** ' + member.user.username + '#' + member.user.discriminator + ' (<@' + member.user.id.toString() + '>)\n**Ingame:** ' + changes.gamertag + ' (' + changes.platform + ')')
        .setThumbnail(member.user.avatarURL({format: 'png', dynamic: true, size: 1024}))
        .setColor(amount > 0 ? colors.success : colors.warning)
        .setFooter('This bot was made with ❤ by iShot#5449');

    if (assigned > 0) {
        for (let roleid in changes.assign) {
            if (!changes.assign.hasOwnProperty(roleid)) {
                continue;
            }

            let role = changes.assign[roleid].role;

            embed.addField(':green_square: Added role', '> **Role:** <@&' + role.id + '>\n> **Gamemode:** ' + func.getName(changes.assign[roleid].gamemode) + '\n> **Property**: ' + func.getName(changes.assign[roleid].property, 'property') + '\n> **Requirement:**: ' + func.numberFormat(changes.assign[roleid].stats, 2) + ' ' + changes.assign[roleid].operator + ' ' + changes.assign[roleid].value);
        }
    }

    if (removed > 0) {
        for (let roleid in changes.remove) {
            if (!changes.remove.hasOwnProperty(roleid)) {
                continue;
            }

            let role = changes.remove[roleid].role;

            embed.addField(':red_square: Removed role', '> **Role:** <@&' + role.id + '>\n> **Gamemode:** ' + func.getName(changes.remove[roleid].gamemode) + '\n> **Property**: ' + func.getName(changes.remove[roleid].property, 'property') + '\n> **Requirement:**: ' + func.numberFormat(changes.remove[roleid].stats, 2) + ' ' + changes.remove[roleid].operator + ' ' + changes.remove[roleid].value);
        }
    }

    console.log('[ROLES] Added ' + assigned + ' and removed ' + removed + ' roles on target ' + member.user.username + '#' + member.user.discriminator);
    placeholder.edit('', embed);
    return embed;
};
exports.rolechanges = rolechanges;

let answer = (placeholder, color, message, title, data) => {
    let embed = new Discord.MessageEmbed();
    embed.setColor(colors[color])
        .setAuthor(config.name.full)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp()
        .setFooter('This bot was made with ❤ by iShot#5449');

    embed.addField('Question by', '<@' + data.ticket.user_id + '>');
    embed.addField('Question', data.ticket.message);
    embed.addField('Reply', data.reply);

    return embed;
};
exports.answer = answer;

let recent = (placeholder, data, title = null, command = null) => {
    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTitle(func.dehashUsername(data.data.username, true) + '\'s __' + data.data.count + '__ most recent matches')
        .setURL(data.url !== undefined ? data.url : config.url + '/?src=recentEmbed')
        .setDescription('Most recent matches')
        .setTimestamp()
        .setFooter('This information is property of Infinity Ward');

    // Build embed fields
    let count = 0;
    for (let matchId in data.matches) {
        if (!data.matches.hasOwnProperty(matchId)) {
            continue;
        }
        count = count + 1;
        let match = data.matches[matchId];
        let hc = false;

        if (!match.data.mode.includes('br_') && match.data.mode.split('_').length !== 1) {
            match.data.mode = match.data.mode.split('_')[0];
            hc = true;
        }

        // Build title
        let title = '';
        if (match.data.mode.includes('br_')) {
            title = (parseInt(match.data.placement) === 1 ? '__Won__' : 'Finished ' + func.positionToMedal(match.data.placement, true));
        } else {
            title = (match.data.isPresentAtEnd ? (match.data.result === 'win' ? '__Won__' : 'Lost') : 'Left');
        }

        title = title + (match.data.mode.includes('br_') ? ' in' : '') + ' a ' + (hc ? '**Hardcore** ' : '') + (gamemodes.modes[match.data.mode] ? gamemodes.modes[match.data.mode].title : 'Unknown Gamemode');
        title = title + ' on ' + (maps[match.data.map] ? maps[match.data.map].title : match.data.map);

        if (match.data.mode.includes('br_')) {
            title = title + ((parseInt(match.data.placement) === 1) ? ' in ' + func.secondsToDhms((match.data.duration / 1000), true, true) : (match.data.mode === 'br_dmz_38' ? ' for ' : ' after ') + func.secondsToDhms((match.properties.data.timePlayed), true, true));
        } else {
            title = title + (match.data.isPresentAtEnd ? (match.data.duration ? ' in ' + func.secondsToDhms((match.data.duration / 1000), true, true) : '') : ' after ' + func.secondsToDhms((match.properties.data.timePlayed), true, true));
        }

        // Build message
        let end = moment.utc(match.data.utcEndSeconds * 1000);
        let message = '';

        message = message + ' Match ended *' + end.fromNow() + '*';

        if (match.data.mode.includes('br_')) {
            message = ((match.data.placement > 0 && match.data.placement <= 10) ? func.positionToMedal(match.data.placement, false, true) : ':pirate_flag:') + message;
            if (match.data.teamInfo && match.data.teamInfo.players && match.data.teamInfo.players.length > 1) {
                // Resort the array with objects based on the 'score' attribute
                match.data.teamInfo.players.sort((a, b) => (a.playerStats.score < b.playerStats.score) ? 1 : -1);

                // Team stats
                for (let [i, player] of Object.entries(match.data.teamInfo.players)) {
                    message = message + '\n' + func.dehashUsername(player.username, true) + ' | Score: `' + player.playerStats.score + '` | Kills: `' + player.playerStats.kills + '` | Deaths: `' + player.playerStats.deaths + '`';
                }
            } else {
                // Player stats
                message = message + '\nScore: `' + func.numberFormat(match.properties.data.score, 0) + '` | XP: `' + func.numberFormat(match.properties.data.totalXp, 0) + '`';
                message = message + '\n' + 'Damage: `' + func.numberFormat(match.properties.data.damageDone, 0) + '`';
                message = message + ' | Kills: `' + func.numberFormat(match.properties.data.kills, 0) + '` | Deaths: `' + func.numberFormat(match.properties.data.deaths, 0) + '`';
            }
        } else {
            message = message + '\nScore: `' + func.numberFormat(match.properties.data.score, 0) + '` | XP: `' + func.numberFormat(match.properties.data.totalXp, 0) + '`';
            message = (match.data.isPresentAtEnd ? (match.data.result === 'win' ? ':green_circle:' : ':red_circle:') : ':rage:') + message;
            message = message + '\n' + 'KDR: `' + func.numberFormat(match.properties.data.kdRatio, 2) + '`';
            message = message + ' | Kills: `' + func.numberFormat(match.properties.data.kills, 0) + '` | Deaths: `' + func.numberFormat(match.properties.data.deaths, 0) + '`';
        }

        message = message + '\n‎';

        embed.addField(title, message + '\n\n');
    }

    placeholder.edit('', embed);

    return embed;
};
exports.recent = recent;

let stats = (placeholder, data, title = null, command = null) => {
    let subtitle = (gamemodes.modes[data.data.gamemode].subtitle !== undefined ? (gamemodes.modes[data.data.gamemode].subtitle === '' ? '' : ' | ' + gamemodes.modes[data.data.gamemode].subtitle) : ' | ' + gametypes.types[data.data.gametype].title);

    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTitle(func.dehashUsername(data.data.username) + (data.data.timeframe === 'weekly' ? ' (weekly stats)' : ''))
        .setURL(data.url !== undefined ? data.url : config.url + '/?src=statsEmbed')
        .setDescription(gamemodes.modes[data.data.gamemode].title + subtitle + (data.data.previous !== null ? '\n*Compared to: ' + moment(data.data.previous).fromNow() + '*' : ''))
        .setTimestamp()
        .setFooter('This information is property of Infinity Ward');

    if (gamemodes.modes[data.data.gamemode] !== undefined && gamemodes.modes[data.data.gamemode].image !== undefined) {
        embed.setThumbnail(config.url + '/images/gamemodes/' + gamemodes.modes[data.data.gamemode].image);
    }

    if (data.data.image !== undefined) {
        embed.setImage(data.data.image);
    }


    // Build embed fields
    for (let property in gamemodes.modes[data.data.gamemode].fields) {
        if (!gamemodes.modes[data.data.gamemode].fields.hasOwnProperty(property)) {
            continue;
        }

        func.buildstatsfield(embed, data, property);
    }

    // if (data.data.gamemode === 'all') {
    //     embed.addField('🆕 | WarZone statistics', 'Add `br` or `plunder` at the end of your command.');
    // }

    placeholder.edit('', embed);

    return embed;
};
exports.stats = stats;

let compare = (placeholder, data, title = null, command = null) => {
    let subtitle = (gamemodes.modes[data.p1.data.gamemode].subtitle !== undefined ? (gamemodes.modes[data.p1.data.gamemode].subtitle === '' ? '' : ' | ' + gamemodes.modes[data.p1.data.gamemode].subtitle) : ' | ' + gametypes.types[data.p1.data.gametype].title);

    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTitle(func.dehashUsername(data.p1.data.username) + ' -vs- ' + func.dehashUsername(data.p2.data.username))
        .setURL(data.url !== undefined ? data.url : config.url + '/?src=statsEmbed')
        .setDescription(gamemodes.modes[data.p1.data.gamemode].title + subtitle)
        .setTimestamp()
        .setFooter('This information is property of Infinity Ward');

    if (gamemodes.modes[data.p1.data.gamemode] !== undefined && gamemodes.modes[data.p1.data.gamemode].image !== undefined) {
        embed.setThumbnail(config.url + '/images/gamemodes/' + gamemodes.modes[data.p1.data.gamemode].image);
    }

    if (data.p1.data.image !== undefined) {
        embed.setImage(data.p1.data.image);
    }


    // Build embed fields
    for (let property in gamemodes.modes[data.p1.data.gamemode].fields) {
        if (!gamemodes.modes[data.p1.data.gamemode].fields.hasOwnProperty(property)) {
            continue;
        }

        func.buildstatscomparefield(embed, data, property);
    }

    placeholder.edit('', embed);

    return embed;
};
exports.compare = compare;

// let weapons = (placeholder, data, author, title = null, command = null) => {
//     // Multiple weapons with emoji's at the bottom to change page forward or backward
//     pagination(placeholder, data.page, data.pages, author);
//     return weapon(placeholder, data, author, title, command, true);
// };
// exports.weapons = weapons;

let weapon = (placeholder, data, message, title = null, command = null, paginated = false) => {
    // Create an embed about this weapon
    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTimestamp()
        .setFooter('This information is property of Infinity Ward');

    // Add image if there is an image available
    if (data.data[data.key].data !== null && data.data[data.key].data.image !== undefined) {
        embed.setImage(data.data[data.key].data.image);
    }

    let descPrefix = (paginated ? '*Only <@' + message.author.id + '> can use the :arrow_left: and :arrow_right: buttons*\nThe buttons stop working after a few minutes of inactivity\n\n' : '');
    if (data.data[data.key].data !== null && data.data[data.key].data.type !== undefined && weapons.types.hasOwnProperty(data.data[data.key].data.type)) {
        embed.setDescription(descPrefix + '**Player:** ' + func.dehashUsername(data.gamertag) + ' (' + data.platform + ')' +
            '\n**Type:** ' + weapons.types[data.data[data.key].data.type].label +
            '\n**Weapon:** ' + func.getName(data.key.replace('iw8_', ''), 'weapon') +
            '\n**ID:** ' + data.key.replace('iw8_', ''));
    } else {
        embed.setDescription(descPrefix + '**Player:** ' + func.dehashUsername(data.gamertag) + ' (' + data.platform + ')' +
            '**Weapon:** ' + func.getName(data.key.replace('iw8_', ''), 'weapon') +
            '\n**ID:** ' + data.key.replace('iw8_', ''));
    }

    if (paginated) {
        embed.setTitle('[' + data.page + '/' + data.pages + '] ' + func.getName(data.key.replace('iw8_', ''), 'weapon'));
    } else {
        embed.setTitle(func.getName(data.key.replace('iw8_', ''), 'weapon'));
    }

    // Build the property fields
    let fields = [
        'KDRRow',
        'SHMRow',
        'headshots',
    ];


    for (let index in fields) {
        if (!fields.hasOwnProperty(index)) {
            continue;
        }

        let key = fields[index];

        if (properties[key] && properties[key].type !== 'combi') {
            let prefix = (properties[key].icon !== undefined ? properties[key].icon + ' ' : '');
            let embedValue = func.valueInType(data.data[data.key].properties[key], properties[key].type);
            embed.addField(prefix + properties[key].title, (embedValue !== '' ? embedValue : '‎'));
        } else {
            let items = [];
            let count = 0;
            for (let index in properties[key].fields) {
                if (!properties[key].fields.hasOwnProperty(index)) {
                    continue;
                }
                count = count + 1;

                let prefix = (properties[properties[key].fields[index].property].icon ? properties[properties[key].fields[index].property].icon + ' ' : '');
                // let embedValue = valueInType(data.properties.data[properties[key].fields[index].property], properties[properties[key].fields[index].property].type);
                let embedValue = func.valueInType(data.data[data.key].properties[properties[key].fields[index].property], properties[properties[key].fields[index].property].type);
                embed.addField(prefix + properties[key].fields[index].title, (embedValue !== '' ? embedValue : '‎'), true);

                // If count is equal to length then fill rest (until 3) with empty fields
                if (count === properties[key].fields.length) {
                    for (let i = (properties[key].fields.length + 1); i <= 3; i++) {
                        // ‎  = empty/hidden character that still registers as a valid character
                        embed.addField('‎', '‎', true);
                    }
                }
            }
        }
    }

    placeholder.edit('', embed);

    return embed;
};
exports.weapon = weapon;

let pagination = (placeholder, data, message, input, duration = 100000, selfreact = true) => {
    // Todo don't add left or right if there is no previous or next page available respectively
    if (selfreact) {
        placeholder.react('⬅️').then(() => placeholder.react('➡️').then(() => reactor(placeholder, message, duration, data, input)));
    } else {
        reactor(placeholder, message, duration, data, input);
    }
};
exports.pagination = pagination;

let reactor = (placeholder, message, duration, data, input) => {
    let filter = (reaction, user) => {
        return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    const collector = placeholder.createReactionCollector(filter, {max: 1, time: duration});

    collector.on('collect', (reaction, user) => {
        let change = 0;

        if (reaction.emoji.name === '➡️') {
            // Get next page from the API
            // Get page from embed in message in react
            change = 1;
        } else {
            // Get previous page from the API
            change = -1;
        }

        if (change !== 0 && reaction.message.embeds[0] !== undefined) {
            let title = reaction.message.embeds[0].title;
            let current = title.match(/\[(.*)\]/).pop().split('/')[0];
            let next = parseInt(current) + change;
            api.call('post', '/api/player/weapons', {...input.processed, page: next}, message)
                .then((response) => {
                    reaction.users.remove(user).then(() => {
                        weapon(placeholder, response.data, message, null, 'weapons', true);
                        pagination(placeholder, response.data, message, input, duration, false);
                    });

                    return true;
                })
                .catch((error) => {
                    if (error.response && error.response.data && error.response.data.message) {
                        exports.error(error, placeholder, error.response.data.message, error.response.data.title ? error.response.data.title : null, 'weapons');
                    } else {
                        exports.error(error, placeholder, 'Something went wrong while contacting our backend. The developer of this bot has been notified about this error.', null, 'weapons');
                    }

                    reaction.message.reactions.removeAll();
                    return false;
                });
        }
    });

    collector.on('end', collected => {
        // if (placeholder.reactions.cache.size > 0) {
        //     placeholder.reactions.removeAll();
        // }
    });
};

let dynatop = (placeholder, vdata, title = null, command = null, channelid = null, messageid = null) => {
    let embed = new Discord.MessageEmbed()
        .setColor(messageid === null ? colors.gray : colors.default)
        .setAuthor(config.name.full)
        .setFooter('「BETA」This bot was made with ❤ by iShot#5449');

    if (messageid === null) {
        // This is a brand new top embed
        // console.log(vdata.gamemode);
        embed.setTitle('Building the ' + func.getName(vdata.gamemode) + ' ' + (vdata.timeframe === 'lifetime' ? 'lifetime' : 'weekly') + ' leaderboard.');

        if (vdata.type === 'online' || vdata.type === 'guild') {
            embed.setDescription('Found ' + vdata.total + (vdata.type === 'online' ? ' __online__' : '') + ' registered members on this server.\n\n**Not yet registered yourself?**\nUse `!mw register`\n\nPlease wait while we collect data...');
        } else {
            embed.setDescription('Found ' + vdata.total + ' members with the <@&' + vdata.type.slice(5) + '> role on this server.\n\n**Not yet registered yourself?**\nUse `!mw register`\n\nPlease wait while we collect data...');
        }

        placeholder.edit('', embed);
        return embed;
    } else {
        // Find the original message
        bot.channels.cache.get(channelid).messages.fetch({around: messageid, limit: 1})
            .then(messages => {
                if (vdata.exception === undefined) {
                    if ((vdata.progress !== undefined || vdata.finished === true) && messages && messages.first().embeds[0]) {
                        let message = messages.first();
                        let embed = new Discord.MessageEmbed(message.embeds[0]);
                        if (vdata.finished === false) {
                            // Data building in progress
                            if (embed.fields.length === 0) {
                                // No status fields yet, let's create some
                                embed.addField('Progress', func.numberFormat((vdata.progress / vdata.total) * 100, 2) + '% (' + vdata.progress + '/' + vdata.total + ')');
                                embed.addField('Processing', vdata.gamertag + ' (' + vdata.platform + ')');
                            } else {
                                embed.fields[0].value = func.numberFormat((vdata.progress / vdata.total) * 100, 2) + '% (' + vdata.progress + '/' + vdata.total + ')';
                                embed.fields[1].value = vdata.gamertag + ' (' + vdata.platform + ')';
                            }
                        } else {
                            // Data building is finished
                            embed = topboard(message, vdata, title, command, channelid, messageid);
                        }

                        message.edit('', embed);
                    }
                } else if (messages && messages.first()) {
                    let placeholder = messages.first();
                    error(null, placeholder, 'Something went wrong while processing this topboard.\n\nThe developer of the bot has been notified of this issue and the full exception was logged.', 'Topboard failed', null, 0);
                }
            });
    }
};
exports.dynatop = dynatop;

let topboard = (placeholder, vdata, title = null, command = null, channelid = null, messageid = null) => {
    if (vdata.finished) {
        // console.log(vdata);

        let embed = new Discord.MessageEmbed()
            .setColor(colors.default)
            .setAuthor(config.name.full)
            .setFooter('「BETA」This information is property of Infinity Ward');

        if (vdata.url) {
            embed.setURL(vdata.url);
        }

        embed.setTitle('Leaderboard for ' + gamemodes.modes[vdata.top_board.gamemode].title + ' (' + (vdata.top_board.timeframe === 'lifetime' ? 'lifetime' : 'weekly') + ').');

        if (vdata.top_board.type === 'online' || vdata.top_board.type === 'guild') {
            embed.setDescription('Containing ' + vdata.found + (vdata.top_board.type === 'online' ? ' __online__' : '') + ' registered members on this Discord server.' + (vdata.url ? '\n\n:new: See the full leaderboard by clicking the (blue) title of this message' : ''));
        } else {
            embed.setDescription('Containing ' + vdata.found + ' registered members with role <@&' + vdata.top_board.type.slice(5) + '>.' + (vdata.url ? '\n\n:new: See the full leaderboard by clicking the (blue) title of this message' : ''));
        }

        // Build the top for each of the stats that actually contains at least one item
        if (parseInt(vdata.found) > 0) {
            for (let [type, topthree] of Object.entries(vdata.data)) {
                if (topthree.length > 0) {
                    let message = '';
                    for (let [index, data] of Object.entries(topthree)) {
                        message = message + func.positionToMedal((parseInt(index) + 1)) + ' `' + func.valueInType(data.value, properties[type].type) + '` by ' + data.gamertag;
                        // If we can find the member, let's try and mention him using data.userid.
                        // There is an issue with adding mentions to embeds, they don't actually parse client-side
                        // let user = placeholder.guild.members.cache.get(data.userid.toString());
                        // if (user !== undefined) {
                        //     message = message + ' <@' + data.userid.toString() + '>';
                        //     placeholder.mentions.users.set(data.userid, user.user);
                        // }

                        message = message + '\n';
                    }

                    embed.addField(properties[type].title, message);
                }
            }
        } else {
            embed.addField('No information found', 'We didn\'t find any information on any of the scanned players');
        }

        return embed;
    }
};
exports.topboard = topboard;


let friends = (placeholder, vdata, title = null, command = null) => {
    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTitle(func.dehashUsername(vdata.data.username) + '\'s __' + vdata.data.friends + '__ friends')
        .setURL(vdata.url !== undefined ? vdata.url : config.url + '/?src=friendsEmbed')
        .setDescription('Friends Leaderboard')
        .setTimestamp()
        .setFooter('This information is property of Infinity Ward');

    for (let [type, data] of Object.entries(vdata.leaderboard)) {
        embed.addField(func.positionToMedal(data.position) + ' ' + properties[type].title, '**Top:** `' + func.numberFormat(data.best, properties[type].decimals) + '` by ' + func.dehashUsername(data.username) + '\n' + '**You:** `' + func.numberFormat(data.you, properties[type].decimals) + '` \n\n');
    }

    placeholder.edit('', embed);

    return embed;
};
exports.friends = friends;

let tracklist = (placeholder, vdata, title = null, command = null) => {
    let embed = new Discord.MessageEmbed()
        .setColor(colors.default)
        .setAuthor(config.name.full)
        .setTitle('Tracking list')
        .setFooter('This bot was made with ❤ by iShot#5449')
        .setTimestamp();

    if (Object.keys(vdata).length === 0) {
        embed.setDescription('There are no active trackings on this Discord server.\n\nStart adding trackings using `!mw track [platform] [gamemode] [type]` or `!mw track me`.');
    } else {
        embed.setDescription('This is a list of all the channel in this Discord server with active trackings in them.');
        // console.log(vdata);
        for (let [channelname, data] of Object.entries(vdata)) {
            let list = '';
            let channelid = 0;
            for (let [key] in data) {
                if (!data.hasOwnProperty(key)) {
                    continue;
                }

                channelid = data[key].channel_id;
                let expiration = data[key].expires_at_utc !== null ? moment.utc(data[key].expires_at_utc * 1000) : null;
                list = list + 'Tracking `' + data[key].gamertag + '` (`' + data[key].platform + '`)' + (expiration === null ? ' :star:' : '') + '\n> ' + (expiration ? 'Expires ' + expiration.fromNow() : '**Permanent**') + '\n> Created by <@' + data[key].discord_id + '>\n> `!mw untrack ' + data[key].id + '`\n\n';
            }

            embed.addField('#' + channelname.toUpperCase(), '<#' + channelid + '>\n\n' + list + '\n\n');
        }
    }

    // embed.addField('Permanent Trackers :new:', 'Are you tired of having to set up your tracker each time you start playing? We now have **permanent** trackers for users with a __supporter__ or higher subscription. Type `!mw premium` for more information.');

    placeholder.edit('', embed);

    return embed;
};
exports.tracklist = tracklist;

let trackerhit = (placeholder, vdata, title = null, command = null) => {
    let hc = false;
    if (!vdata.data.mode.includes('br_') && vdata.data.mode.split('_').length !== 1) {
        vdata.data.mode = vdata.data.mode.split('_')[0];
        hc = true;
    }

    let embedtitle = func.dehashUsername(vdata.data.username, true);

    // For warzone modes we don't put win/loss/left in the title
    if (vdata.data.gameType === 'wz') {
        embedtitle = embedtitle + (vdata.data.mode !== 'br_87' ? '\'s team' : '');
        // if (vdata.data.mode === 'br_25' || vdata.data.mode === 'br_87') {
        embedtitle = embedtitle + ' finished __' + func.ordinalSuffix(parseInt(vdata.properties.data.teamPlacement)) + '__';
        embedtitle = embedtitle + ' against ' + (vdata.data.teamCount !== undefined ? vdata.data.teamCount + ' teams' : vdata.data.playerCount + ' players');
        // } else {
        //     embedtitle = embedtitle + ' played a ' + (gamemodes.modes[vdata.data.mode] ? gamemodes.modes[vdata.data.mode].title : 'Unknown Gamemode') + ' against ' + vdata.data.playerCount + ' players';
        // }
    } else {
        if (vdata.data.mode === 'infect') {
            embedtitle = embedtitle + ' played';
        } else {
            embedtitle = embedtitle + ' ' + (vdata.data.isPresentAtEnd ? (vdata.data.result === 'win' ? '__Won__' : 'lost') : 'left');
        }
        embedtitle = embedtitle + (vdata.data.gameType === 'wz' ? ' in ' : ' a ') + (hc ? '**Hardcore** ' : '') + (gamemodes.modes[vdata.data.mode] ? gamemodes.modes[vdata.data.mode].title : 'Unknown Gamemode');
        embedtitle = embedtitle + ' on ' + (maps[vdata.data.map] ? maps[vdata.data.map].title : vdata.data.map);
    }

    let embed = new Discord.MessageEmbed();
    if (vdata.data.gameType === 'wz') {
        // Calculate the color depending on the ratio of (player)timePlayed vs (match)duration
        let gamemode = (gamemodes.modes[vdata.data.mode] ? gamemodes.modes[vdata.data.mode].title : 'Unknown Gamemode');
        embed.setColor(vdata.data.color !== undefined ? vdata.data.color : colors.warning)
            .setDescription('**Gamemode**: ' + gamemode + '\n**Match ended at**: ' + vdata.data.finishedAt + ' UTC');
    } else {
        let score1 = (vdata.data.team === 'allies' ? '__' + vdata.data.team1Score + '__' : vdata.data.team1Score);
        let score2 = (vdata.data.team === 'allies' ? vdata.data.team2Score : '__' + vdata.data.team2Score + '__');

        embed.setColor(vdata.data.mode === 'infect' ? colors.warning : (vdata.data.result === 'win' ? colors.success : (vdata.data.result === 'loss' ? colors.danger : colors.warning)))
            .setDescription('Score: ' + score1 + ' - ' + score2);
    }

    // console.log(config.url + '/images/gamemodes/' + gamemodes.modes[vdata.data.mode].image);

    embed.setAuthor(config.name.full, (gamemodes.modes[vdata.data.mode] && gamemodes.modes[vdata.data.mode].image !== undefined) ? config.url + '/images/gamemodes/' + gamemodes.modes[vdata.data.mode].image : null)
        .setTitle(embedtitle)
        .setFooter('This information is property of Infinity Ward')
        .setTimestamp();

    if (maps[vdata.data.map] && maps[vdata.data.map].image) {
        embed.setThumbnail(config.url + '/images/maps/' + maps[vdata.data.map].image);
    }


    for (let property in gamemodes.modes[vdata.data.mode].matchhit) {
        if (!gamemodes.modes[vdata.data.mode].matchhit.hasOwnProperty(property)) {
            continue;
        }

        vdata.data.gamemode = vdata.data.mode;
        func.buildstatsfield(embed, vdata, property, 'matchhit');
    }

    func.buildteaminfofield(embed, vdata, 'matchhit');


    if (placeholder) {
        placeholder.edit('', embed);
    }

    return embed;
};
exports.trackerhit = trackerhit;
