/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
// const func = require('../modules/functions.js');
const bot = MWDB.bot;

// const config = MWDB.config;

function send(type, message, embed = null, all = false) {

    if (bot.shard.ids[0] === 0 || all) {
        MWDB.hooks[type].send(message, embed);
    }
}

exports.send = send;
