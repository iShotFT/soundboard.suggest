#!/usr/bin/env node
/*jshint esversion: 9 */

/*
 * Author: Andries 'iShot' Verbanck
 * Website: [modernwarfarediscordbot.com](https://modernwarfarediscordbot.com/?src=github)
 * Greatly inspired by <3 [bananaprotocol/confax](https://github.com/bananaprotocol/confax?src=mwdb_github)
 */

const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const config = require('./config.json');

exports.bot = bot;
exports.config = config;
exports.commands = {
    default: {},
    pm: {},
};
exports.hooks = {};

let registerCommand = function (name, type, callback, aliases, description, usage = null, examples = []) {
    exports.commands[type][name] = {aliases, description, usage, examples, process: callback};
};

let loadScript = (path) => {
    require(path);
    if (config.debug) {
        console.log('[INFO] Script loaded at ' + path);
    }
};

exports.registerCommand = registerCommand;
exports.loadScript = loadScript;


// Register and load all data nodes
exports.data = {};
let data = fs.readdirSync('./data/');
data.forEach(file => {
    if (file.substring(file.length - 5, file.length) === '.json') {
        exports.data[file.split('.')[0]] = require('./data/' + file);
        if (config.debug) {
            console.log('[INFO] Registered data node from file ' + file);
        }
    }
});

// Register the different available commands
let commands = fs.readdirSync('./commands/');
commands.forEach(script => {
    if (script.substring(script.length - 3, script.length) === '.js') {
        loadScript('./commands/' + script);
    }
});

// Register the webhooks (socket.io) we're listening to
let hooks = config.webhooks;
for (let type in hooks) {
    if (hooks.hasOwnProperty(type)) {
        let data = hooks[type];
        exports.hooks[type] = new Discord.WebhookClient(data.id, data.token);
        if (config.debug) {
            console.log('[INFO] Webhook registered for type ' + type);
        }
    }
}

// Register and load all modules
let modules = fs.readdirSync('./modules/');
modules.forEach(script => {
    if (script.substring(script.length - 3, script.length) === '.js') {
        loadScript('./modules/' + script);
    }
});

// Register settings for use as per-server settings later on
// bot.settings = new Keyv('redis://' + config.redis.host + ':' + config.redis.port, {namespace: 'settings', db: 3});
bot.defaultSettings = exports.data.settings;
