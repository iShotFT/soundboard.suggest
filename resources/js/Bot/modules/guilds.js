/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const api = require('../actions/apicall');
const axios = require('axios');
const bot = MWDB.bot;
const config = MWDB.config;
const hooks = MWDB.hooks;


bot.on('guildCreate', guild => {
    hooks.notification.send(':green_circle: ' + config.name.short + ' was added to server `' + guild.name + '` (id: `' + guild.id + '`, members: `' + guild.memberCount + '`). We now have `' + bot.guilds.cache.size + '` active servers on shard `#' + bot.shard.ids[0] + '`!');

    // api.call('post', '/api/guilds/add/single', {
    //     name: guild.name,
    //     guildid: guild.id,
    //     ownerid: (guild.owner !== null ? guild.owner.user.id : null),
    //     members: guild.memberCount,
    //     icon: guild.icon,
    // }).then((response) => {
    //     console.log('[INFO] ' + response.data.message);
    //     if (response.data.welcome !== undefined && parseInt(response.data.welcome) === 1) {
    //         console.log('[INFO] Sending welcome message to Discord user ' + guild.owner.user.username + '#' + guild.owner.user.discriminator);
    //         guild.owner.send('Thank you for installing ' + config.name.full + ' to the `' + guild.name + '` Discord server.\n\n__Website:__ ' + config.url + '\n__Getting started:__ In your Discord server, type `' + config.prefix + '` to get started.\n__Support:__ Need help or want to share some feedback? Join the our Discord server: ' + config.bot.support.invite + '\n\nWith kind regards,\niShot#5449');
    //     } else {
    //         console.log('[INFO] Not sending welcome message to Discord user ' + guild.owner.user.username + '#' + guild.owner.user.discriminator + ' because they had the bot installed before.');
    //     }
    //
    // }).catch((error) => {
    //     console.log(error.response);
    //     console.log('[ERROR] ' + error.response.data.message);
    // });
});

bot.on('guildDelete', guild => {
    hooks.notification.send(':red_circle: ' + config.name.short + ' was removed from server `' + guild.name + '` (id: `' + guild.id + '`, members: `' + guild.memberCount + '`). We now have `' + bot.guilds.cache.size + '` active servers on shard `#' + bot.shard.ids[0] + '`!');

    // api.call('post', '/api/guilds/uninstall', {
    //     guildid: guild.id,
    // }).then((response) => {
    //     console.log('[INFO] ' + response.data.message);
    // }).catch((error) => {
    //     console.log('[ERROR] ' + error.response.data.message);
    // });
});

bot.on('guildMemberAdd', member => {
    if (member.guild.id === config.bot.home) {
        // Assign the premium roles on join if they have any
        api.call('post', '/api/player/plan', {}).then((response) => {
            let role = member.guild.roles.cache.find(role => role.id === config.premium[response.data.plan].role);
            member.roles.add(role);
            console.log('[PREMIUM] Role ' + response.data.plan + ' assigned to user ' + member.user.username + ' in our Discord server when they joined');
        }).catch((error) => {
            if (error.response && error.response.data && error.response.data.message) {
                console.log('[ERROR] ' + error.response.data.message);
            } else {
                console.log('[ERROR] ' + error.stack);
            }
        });
    }
});
