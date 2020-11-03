/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../../bot-shard.js');
const embed = require('../embed.js');
const func = require('../functions.js');
const hook = require('../hooks.js');
const io = require('socket.io-client');
const Echo = require('laravel-echo');
const moment = require('moment');
const bot = MWDB.bot;
const config = MWDB.config;
const gamemodes = MWDB.data.gamemodes;

let echo = new Echo({
    broadcaster: 'socket.io',
    host: config.socket.endpoint + ':' + config.socket.port,
    client: io,
});

echo.connector.socket.on('connect', function () {
    console.log('[ECHO] shard #' + bot.shard.ids[0] + ' connected', echo.socketId());
});
echo.connector.socket.on('disconnect', function () {
    console.log('[ECHO] shard #' + bot.shard.ids[0] + ' disconnected');
});
echo.connector.socket.on('reconnecting', function (attemptNumber) {
    console.log('[ECHO] shard #' + bot.shard.ids[0] + ' reconnecting', attemptNumber);
});

echo.channel(`public`)
    .listen('.topgg.vote', (e) => {
        // If user if in the home server.
        let home = bot.guilds.cache.get(config.bot.home.toString());
        hook.send('notification', ':blue_heart: User `' + e.user_id.toString() + '` added a vote for our bot on top.gg.');
        if (home && home.members.cache.get(e.user_id.toString()) !== undefined) {
            if (parseInt(e.count) === 1) {
                hook.send('votes', ':heart: There is a first for everything, thank you <@' + e.user_id.toString() + '> for your first vote for our bot on top.gg! Do you also like the bot? Help us by voting @ https://bit.ly/39lbFky');
            } else {
                if (e.count >= 10) {
                    hook.send('votes', ':heart: A real legend, <@' + e.user_id.toString() + '> voted for our bot for the ' + func.ordinalSuffix(parseInt(e.count)) + ' time on top.gg! We can\'t thank you enough! Do you also like the bot? Help us by voting @ https://bit.ly/39lbFky');
                } else {
                    hook.send('votes', ':heart: Thank you for your ' + func.ordinalSuffix(parseInt(e.count)) + ' vote for our bot on top.gg <@' + e.user_id.toString() + '>. Really appreciate it! Do you also like the bot? Help us by voting @ https://bit.ly/39lbFky');
                }
            }
        } else {
            // User is not in the home server
            hook.send('votes', ':heart: Thank you for your ' + func.ordinalSuffix(parseInt(e.count)) + ' vote for our bot on top.gg <@' + e.user_id.toString() + '>. Really appreciate it! Do you also like the bot? Help us by voting @ https://bit.ly/39lbFky');
        }
    })
    .listen('.tracking.expired', (e) => {
        let timePassed = func.secondsToDhms(Math.ceil((Date.parse(e.track.expires_at) - Date.parse(e.track.created_at)) / 1000), true);
        hook.send('trackers', ':sleeping_accommodation: Tracking `' + func.pad(e.track.id, 3) + '` by `' + e.track.discord_name + '` expired in `' + timePassed + '`, after sending `' + e.track.hits + '` hits on player `' + e.track.gamertag + '` (`' + e.track.platform + '`)');

        if (bot.channels.cache.get(e.track.channel_id)) {
            let embed2 = embed.normal(null, 'gray', 'Tracking for player  `' + e.track.gamertag + '` (`' + e.track.platform + '`) expired after ' + timePassed, 'Tracker expired', null, false, true);
            bot.channels.cache.get(e.track.channel_id).send('', embed2);
            console.log('[TRACKING] Sent tracking expired notification for ID ' + e.track.id + ' to channel ' + e.track.channel_id);
        }
    })
    .listen('.forge.deploy', (e) => {
        hook.send('notification', ':compression: Forge deployed to the live server with status: `' + e.status + '`');
    })
    .listen('.tracking.created', (e) => {
        hook.send('trackers', ':eye: Tracking `' + func.pad(e.track.id, 3) + '` was registered by `' + e.track.discord_name + '` for player `' + e.track.gamertag + '` (`' + e.track.platform + '`)');
    })
    .listen('.tracking.match.found', (e) => {
        if (gamemodes.modes[e.data.data.mode] === undefined) {
            // Gamemode not found, trigger an error
            console.log('[ERROR] Gamemode not found: \'' + e.data.data.mode + '\'');
            hook.send('notification', ':grey_question: Gamemode missing for trackers: `' + e.data.data.mode + '`');
        } else {
            hook.send('trackers', ':satellite: Match details for match `' + e.track.last_match_id + '` for tracker `' + func.pad(e.track.id, 3) + '` was sent to channel `' + e.track.channel_id + '`');
            if (bot.channels.cache.get(e.track.channel_id)) {
                let embed2 = embed.trackerhit(null, e.data);
                bot.channels.cache.get(e.track.channel_id).send('', embed2);
                console.log('[TRACKING] Sending match ID ' + e.matchid + ' details for tracking ID ' + e.track.id + ' to channel ' + e.track.channel_id);
            }
        }
    })
    .listen('.map.new', (e) => {
        hook.send('notification', ':map: A new map (that we don\'t have in our database yet) has been found on the COD API `' + e.map + '` with gamemodes `' + e.gamemodes.join('`, `') + '`.' + (e.saved ? ' This map has now been added to the database correctly, make sure to use the admin page to give it a proper name and image.' : ''));
    })
    .listen('.rate.limited', (e) => {
        hook.send('notification', ':flag_white: ' + e.message);
    })
    .listen('.tokens.reinstalled', (e) => {
        hook.send('notification', ':ticket: ' + e.message);
    })
    .listen('.cod.api.down', (e) => {
        hook.send('notification', ':small_red_triangle_down: ' + e.message);
    })
    .listen('.top.board.shackle.processed', (e) => {
        if (parseInt(e.shard_id) === bot.shard.ids[0]) {
            if (bot.channels.cache.get(e.channel_id)) {
                embed.dynatop(null, e, null, null, e.channel_id, e.message_id);
            }
        }
    })
    .listen('.top.board.finished', (e) => {
        hook.send('topboard', ':new_moon: The processing of topboard `' + e.top_board.id + '` has finished ' + moment.duration(e.duration, 'seconds').humanize(true) + ', we found `' + e.found + '` players.');
        if (parseInt(e.top_board.shard_id) === bot.shard.ids[0]) {
            // We are on the correct shard to update the message
            if (bot.channels.cache.get(e.top_board.channel_id)) {
                embed.dynatop(null, e, null, null, e.top_board.channel_id, e.top_board.message_id);
                console.log('[DYNATOP] Updated message ' + e.top_board.message_id + ' with their top stats');
            }
        }
    })
    .listen('.top.board.failed', (e) => {
        hook.send('topboard', ':poop: The processing of topboard `' + e.top_board_id + '` has failed. Full exception should be in the logs.');

        if (parseInt(e.shard_id) === bot.shard.ids[0]) {
            // We are on the correct shard to update the message
            if (bot.channels.cache.get(e.channel_id)) {
                // console.log(e);
                embed.dynatop(null, e, null, null, e.channel_id, e.message_id);
                console.log('[ERROR] Updated message ' + e.message_id + ' to a failed topboard message.');
            }
        }


    })
    .listen('.ticket.created', (e) => {
        // Tickets are triggered by sockets because in the future we want to work out a ticketing system on the website as well
        let ticket = embed.normal(null, 'hotpink', '**Username**: ' + e.username + '\n**Guild**: ' + e.guild + '\n**Channel**: ' + e.channel + '\n\n```' + e.message + '```\n\nTo answer on this ticket, PM the bot\n`!mw answer ' + e.id + ' <answer>`', ':tickets: Ticket created (ID #' + func.pad(e.id, 3) + ')');
        hook.send('tickets', '', ticket);

        // Send private message with reply
        if (bot.guilds.cache.get(config.bot.home.toString()) && bot.users.cache.get(config.bot.owner.toString())) {
            bot.users.cache.get(config.bot.owner.toString()).send('', ticket)
                .then(placeholder => {
                    console.log('[INFO] Sent a ticket message the bot owner');
                })
                .catch(error => {
                    console.log('[ERROR] Failed to send a ticket message to bot owner');
                });
        }
    })
    .listen('.ticket.answered', (e) => {
        console.log('Ticket answered trigger');
        // {
        //     ticket: {
        //         id: 79,
        //             user: 'iShot#5449',
        //             user_id: 177114700616695800,
        //             guild_id: '646782463682805770',
        //             guild_name: 'MW:Discord Bot | Support & Information',
        //             channel_id: '649692872848703518',
        //             channel_name: 'private-local-test',
        //             message: 'Testing again four',
        //             reply: 'This is my reply to your support request',
        //             replied_at: '2020-03-21 10:58:06',
        //             created_at: '2020-03-21 10:57:44',
        //             updated_at: '2020-03-21 10:58:06'
        //     },
        //     reply: 'This is my reply to your support request'
        // }
        let answer = embed.answer(null, 'hotpink', 'You received a reply on your support ticket.', ':tickets: Ticket replied (ID #' + func.pad(e.ticket.id, 3) + ')', e);

        // Send private message with reply
        if (bot.users.cache.get(e.ticket.user_id)) {
            bot.users.cache.get(e.ticket.user_id).send('', answer)
                .then(placeholder => {
                    console.log('[INFO] Sent a private message to user ' + e.ticket.user);
                })
                .catch(error => {
                    console.log('[ERROR] Failed to send a private message to user ' + e.ticket.user);
                });
        }

        if (bot.channels.cache.get(e.ticket.channel_id)) {
            bot.channels.cache.get(e.ticket.channel_id).send('', answer);
        }
    })
    .listen('.user.personal.help.needed', (e) => {
        // e.user_social.discord_id
        // e.user_social.nickname
        hook.send('notification', ':dolphin: We sent a personal help message to user ' + e.user_social.nickname);
        if (bot.users.cache.get(e.user_social.discord_id.toString())) {
            bot.users.cache.get(e.user_social.discord_id.toString()).send('Hello ' + e.user_social.nickname + ',\n\n' +
                'It looks like you might need some help using the **' + config.name.full + '**.\n' +
                'Here are some things that might help you:\n\n' +
                ':small_blue_diamond: Live support and a list of frequently asked questions: ' + config.bot.support.invite + '\n' +
                ':small_blue_diamond: Use `!mw help` in your Discord server for a list of the available commands\n' +
                ':small_blue_diamond: You can send a message directly to the developer of the bot using `!mw support <message>` (for example: !mw support I don\'t know how to use the tracker commands)\n' +
                ':small_blue_diamond: We have documentation available on our website: ' + config.url + '?src=pmhelp\n' +
                'We will not send this message again for another 3 days.\n\n' +
                'With kind regards,\n\n' +
                config.name.full)
                .then(placeholder => {
                    console.log('[PERSONAL HELP] Sent a personal help message to user ' + e.user_social.nickname);
                })
                .catch(error => {
                    console.log('[ERROR] Failed sending a personal help message to user ' + e.user_social.nickname);
                });
        }

        // MWDB.hooks.notification.send(':smiley: A new user with handle `' + e.user_social.nickname + '` (`' + e.user_social.discord_id + '`) registered on the website');
    })
    .listen('.user.social.created', (e) => {
        hook.send('notification', ':smiley: A new user with handle `' + e.user_social.nickname + '` (`' + e.user_social.discord_id + '`) was registered.' + (e.from_website === true ? ' The registration was triggered from the website.' : ''));
    })
    .listen('.property.missing', (e) => {
        hook.send('notification', ':projector: We encountered a property `' + e.property + '` that is missing from the properties.json file');
    })
    .listen('.notification', (e) => {
        let embed2 = buildNotificationEmbed(e.message, e.title, e.url);

        console.log('[INFO] Notification task received.');
        hook.send('notification', ':loudspeaker: A notification is being sent to all ' + e.channels.length + ' active servers (only to the last channel the bot was active in, if active at all in the past month)', embed2);

        if (e.channels.length) {
            for (let channelid in e.channels) {
                if (!e.channels.hasOwnProperty(channelid)) {
                    continue;
                }

                if (bot.channels.cache.get(e.channels[channelid])) {
                    bot.channels.cache.get(e.channels[channelid]).send(':loudspeaker: Announcement', embed2);
                    console.log('[ANNOUNCEMENT] Sent message to channelid ' + e.channels[channelid] + '');
                } else {
                    //console.log('[ANNOUNCEMENT] Tried to send message to channelid ' + e.channels[channelid] + ' but it failed, couldn\'t find channel');
                }
            }
        }
    })
    .listen('.stripe.subscription.created', (e) => {
        hook.send('subscriptions', ':credit_card: User `' + e.user.name + '` (`' + e.user.email + '` - `' + e.stripe_customer_id + '`) started a __' + e.plan + '__ subscription (`' + e.stripe_subscription_id + '`).');
    })
    .listen('.stripe.subscription.cancelled', (e) => {
        hook.send('subscriptions', ':stop_button: User `' + e.user.name + '` (`' + e.user.email + '` - `' + e.stripe_customer_id + '`) cancelled a __' + e.plan + '__ subscription (`' + e.stripe_subscription_id + '`). It expires in ' + moment(e.at).fromNow() + ' (`' + e.at + '`)');
    })
    .listen('.stripe.subscription.resumed', (e) => {
        hook.send('subscriptions', ':play_pause: User `' + e.user.name + '` (`' + e.user.email + '` - `' + e.stripe_customer_id + '`) resumed a __' + e.plan + '__ subscription (`' + e.stripe_subscription_id + '`).');
    })
    .listen('.stripe.customer.created', (e) => {
        hook.send('subscriptions', ':man_astronaut: New customer created for user `' + e.customer.name + '` (`' + e.customer.email + '`) - `' + e.customer.id + '`');
    })
    .listen('.stripe.invoice.paid', (e) => {
        hook.send('subscriptions', ':moneybag: An invoice was paid by user `' + e.user.name + '` (`' + e.user.email + '`) for the __' + e.plan + '__ subscription. An amount of `' + e.amount + ' EUR` was successfully received by Stripe.');
    })
    .listen('.sync.roles', (e) => {
        let target = bot.guilds.cache.get(e.target.toString());
        if (target) {
            // Target server found in this shard
            for (let [userid, roleid] of Object.entries(e.roles)) {
                let role = target.roles.cache.get(roleid.toString());
                let user = target.members.cache.get(userid.toString());
                if (user) {
                    if (!user.roles.cache.has(role.id)) {
                        console.log('[ROLES] Assigned role ' + role.name + ' to ' + user.user.username + ' in server ' + target.name);
                        user.roles.add(role);
                    }
                }
            }
        }
    });
// .listen('.error.thrown', (e) => {
//     let embed = new Discord.MessageEmbed().setTitle(e.message.substring(0, 256)).addField('Error', '```shell\n' + e.stack.substring(0, 1000) + '```');
//     hook.send('error', ':warning: The Laravel backend threw an error', embed);
// });

exports.echo = echo;

function buildNotificationEmbed(message, title, url) {
    let embed = new Discord.MessageEmbed();
    embed.setColor('#ff69b4')
        .setAuthor('Modern Warfare Discord Bot')
        .setTitle(title)
        .setDescription(message)
        .setURL(url)
        .setTimestamp()
        .setFooter('This bot was made with ❤ by iShot#5449');

    return embed;
}
