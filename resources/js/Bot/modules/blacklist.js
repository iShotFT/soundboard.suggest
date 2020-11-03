/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const func = require('../modules/functions.js');
const api = require('../actions/apicall.js');
const bot = MWDB.bot;
const config = MWDB.config;

let isBlacklisted = async (guildid) => {
    return await getBlacklist()
        .then((blist) => {
            return blist.includes(guildid);
        })
        .catch((error) => {
            console.log('[BLACKLIST] Couldn\'t check if guild ' + guildid + ' is blacklist due to error');
            console.log(error.stack);
            return false;
        });
};

exports.isBlacklisted = isBlacklisted;

let getBlacklist = async () => {
    return await api.call('post', '/api/guilds/blacklist', {})
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log('[BLACKLIST] Couldn\'t check blacklist due to error');
            console.log(error.stack);
            return [];
        });
};

exports.getBlacklist = getBlacklist;
