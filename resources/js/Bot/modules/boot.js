/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const api = require('../actions/apicall.js');
// const settings = require('../modules/settings.js');
// const func = require('../modules/functions.js');
const bot = MWDB.bot;
const config = MWDB.config;
const hooks = MWDB.hooks;

bot.on('ready', () => {
    // console.log(bot.emojis);
    bot.user.setActivity(config.activity.name, {type: config.activity.type});

    let data = [];
    bot.guilds.cache.forEach(function (guild) {
        let guildData = {
            name: guild.name,
            guildid: guild.id,
            ownerid: (guild.owner !== null ? guild.owner.user.id : null),
            members: guild.memberCount,
            icon: guild.icon,
            shard: bot.shard.ids[0],
        };

        let botGuildUser = guild.members.cache.get(bot.user.id.toString());
        if (botGuildUser !== undefined) {
            guildData.installed_at = botGuildUser.joinedAt;
        }

        data.push(guildData);
    });

    // api.call('post', '/api/guilds/add/multiple', {data: data})
    //     .then((response) => {
    //         console.log('[INFO] ' + response.data.message);
    //     });

    if (config.environment === 'production') {
        MWDB.hooks.notification.send(`:desktop: ` + config.name.full + ` shard #${bot.shard.ids[0]} has started, with ${bot.users.cache.size} unique users, in ${bot.channels.cache.size} channels of ${bot.guilds.cache.size} guilds.`);
    }

    console.log('[INFO] ' + config.name.short + ' (shard #' + bot.shard.ids[0] + ') has connected to Discord.');
});

bot.on('reconnecting', () => {
    bot.user.setActivity(config.activity.name, {type: config.activity.type});
    console.log('[INFO] ' + config.name.short + ' has reconnected to Discord.');
});

bot.on('error', (e) => console.error(e));
bot.on('shardError', (e) => console.error(e));
bot.on('rateLimit', (e) => {
    console.log('[RATE LIMITED]', e, e.timeout);
});

if (config.debug) {
    bot.on('warn', (e) => console.warn(e));
    bot.on('debug', (e) => console.info(e));
}

bot.on('guildUnavailable', (e) => {
    console.log('[GUILD UNAVAILABLE]', e);
});

bot.on('unknown', (e) => {
    console.log('[UNKNOWN]', e);
});

bot.login(config.bot.token).catch((e) => console.log(e.stack));
