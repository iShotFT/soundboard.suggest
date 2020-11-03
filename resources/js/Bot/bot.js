#!/usr/bin/env node
/*jshint esversion: 9 */
const config = require('./config.json');

const {ShardingManager} = require('discord.js');
const manager = new ShardingManager('./bot-shard.js', {token: config.bot.token});

manager.spawn(config.bot.shards.amount >= 1 ? config.bot.shards.amount : undefined, config.bot.shards.delay);
manager.on('launch', shard => console.log(`Launched shard ${shard.ids[0]}`));

manager.on('message', (shard, message) => {
    console.log(`Shard[${shard.ids[0]}] : ${message._eval} : ${message._result}`);
});
