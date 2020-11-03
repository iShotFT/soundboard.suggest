/*jshint esversion: 9 */

const MWDB = require('../bot-shard.js');
const bot = MWDB.bot;

let settings = async (guildid) => {
    // let settings = await bot.settings.get(guildid);
    return bot.defaultSettings;
};
exports.settings = settings;

let get = async (guildid, key) => {
    let settings = await this.settings(guildid);

    if (settings.hasOwnProperty(key)) {
        return settings[key];
    } else {
        if (bot.defaultSettings.hasOwnProperty(key)) {
            return bot.defaultSettings[key];
        } else {
            return undefined;
        }
    }
};
exports.get = get;
