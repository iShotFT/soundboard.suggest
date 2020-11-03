/*jshint esversion: 9 */

const Discord = require('discord.js');
const MWDB = require('../bot-shard.js');
const axios = require('axios').default;
const bot = MWDB.bot;
const config = MWDB.config;

let apiCall = async (method, url, data, message = null) => {
    url = config.api.baseUri + url;

    let defaultData = {
        key: config.api.token,
    };

    let messageData = {};
    if (message !== null) {
        let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        let command = args.shift().toLowerCase();

        messageData = {
            shardid: bot.shard.ids[0],
            guildid: message.guild.id,
            guildname: message.guild.name,
            channelid: message.channel.id,
            channelname: message.channel.name,
            userid: message.author.id,
            username: message.author.username + '#' + message.author.discriminator,
            avatar: message.author.avatarURL({format: 'png', dynamic: true, size: 1024}),
            command: command,
            arguments: args.join(' '),
        };
    }

    data = {...defaultData, ...messageData, ...data};

    if (config.debug) {
        console.log('[DEBUG] Firing ' + method.toUpperCase() + ' request to url ' + url + ' with data:');
        console.log(data);
    }

    return await axios({
        method: method.toLowerCase(),
        url: url,
        data: data,
    });
};

exports.call = apiCall;
