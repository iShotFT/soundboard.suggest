/*jshint esversion: 9 */

const MWDB = require('../bot-shard.js');
const bot = MWDB.bot;
const config = MWDB.config;
const commands = MWDB.commands;
const gamemodes = MWDB.data.gamemodes;
const maps = MWDB.data.maps;
const properties = MWDB.data.properties;
const wpns = MWDB.data.weapons;

let percToHex = (perc, asHex = true) => {
    var hue = perc * 1.2 / 360;
    return HSLToHex(hue, 1, 0.5);
};
exports.percToHex = percToHex;

let usage = (command) => {
    return config.prefix + ' ' + command + ' ' + commands.default[command].usage;
};
exports.usage = usage;

let listUsages = (asText = false) => {
    let output = {};
    let textual = '';
    for (let type in commands) {
        if (!commands.hasOwnProperty(type)) {
            continue;
        }

        if (type === 'pm') {
            continue;
        }

        for (let mainCommand in commands[type]) {
            if (!commands[type].hasOwnProperty(mainCommand)) {
                continue;
            }

            if (asText) {
                textual = textual + '`' + config.prefix + ' ' + mainCommand + ' ' + (commands[type][mainCommand].usage ? commands[type][mainCommand].usage : '') + '`\n';
            } else {
                output[mainCommand] = commands[type][mainCommand].usage;
            }
        }
    }

    return asText ? textual : output;
};
exports.listUsages = listUsages;

let me = (message, args) => {
    let index = args.indexOf('me');

    if (index !== -1) {
        args.splice(index + 1, 0, message.author.id.toString());
    }

    return args;
};
exports.me = me;

let buildteaminfofield = (embed, data, type = 'fields') => {
    if (data.data.teamInfo !== undefined && data.data.teamInfo.players !== undefined && data.data.teamInfo.players.length > 1) {
        let teamInfoRows = [];

        // Sort players by score
        let players = data.data.teamInfo.players;
        players.sort((a, b) => (a.playerStats.score > b.playerStats.score) ? -1 : 1);

        let position = 0;
        players.forEach(player => {
            position++;
            teamInfoRows.push(
                positionToMedal(position) + ' ' + dehashUsername(player.username, true),
            );
        });

        embed.addField('Team info (score)', teamInfoRows.join(' | '));
    }
};
exports.buildteaminfofield = buildteaminfofield;

let buildstatsfield = (embed, data, property, type = 'fields') => {
    let key = gamemodes.modes[data.data.gamemode][type][property];
    if (properties[key] && properties[key].type !== 'combi') {
        let prefix = (properties[key].icon !== undefined ? properties[key].icon + ' ' : '');
        if (properties[key].type === 'level') {
            let embedValue = valueInType(data.data.level + data.data.prestige, 'int');
            embed.addField(prefix + properties[key].title, embedValue !== '' ? embedValue : '‎');
        } else {
            let changeIcon = '';
            let changeValue = '';
            if (data.properties.previous !== undefined && data.properties.previous[key] !== undefined && (properties[key].compare === true)) {
                changeIcon = (data.properties.previous[key] === data.properties.data[key] ? '= ' : data.properties.data[key] > data.properties.previous[key] ? '▲ ' : '▼ ');
                let diff = data.properties.data[key] - data.properties.previous[key];
                changeValue = (diff !== 0 ? ' (' + (diff > 0 ? '+' : '') + valueInType(data.properties.data[key] - data.properties.previous[key], properties[key].type) + ')' : '');
            }

            let embedValue = valueInType(data.properties.data[key], properties[key].type) + changeValue;
            if (data.data.timeframe !== undefined && data.data.timeframe === 'weekly' && properties[key].weekly !== undefined && properties[key].weekly === false) {
                // Nothing
            } else {
                embed.addField(changeIcon + prefix + properties[key].title, (embedValue !== '' ? embedValue : '‎'));
            }
        }
    } else {
        let items = [];
        let count = 0;
        let total = properties[key].fields.length;
        for (let index in properties[key].fields) {
            if (!properties[key].fields.hasOwnProperty(index)) {
                continue;
            }

            let changeIcon = '';
            let changeValue = '';
            if (data.properties.previous !== undefined && data.properties.previous[properties[key].fields[index].property] !== undefined && (properties[properties[key].fields[index].property].compare === true)) {
                changeIcon = (data.properties.previous[properties[key].fields[index].property] === data.properties.data[properties[key].fields[index].property] ? '= ' : data.properties.data[properties[key].fields[index].property] > data.properties.previous[properties[key].fields[index].property] ? '▲ ' : '▼ ');
                let diff = data.properties.data[properties[key].fields[index].property] - data.properties.previous[properties[key].fields[index].property];
                changeValue = (diff !== 0 ? ' (' + (diff > 0 ? '+' : '') + valueInType(data.properties.data[properties[key].fields[index].property] - data.properties.previous[properties[key].fields[index].property], properties[properties[key].fields[index].property].type) + ')' : '');
            }

            let prefix = (properties[properties[key].fields[index].property].icon ? properties[properties[key].fields[index].property].icon + ' ' : '');
            let embedValue = valueInType(data.properties.data[properties[key].fields[index].property], properties[properties[key].fields[index].property].type) + changeValue;


            if (data.data.timeframe !== undefined && data.data.timeframe === 'weekly' && properties[properties[key].fields[index].property].weekly !== undefined && properties[properties[key].fields[index].property].weekly === false) {
                // Nothing
                total = total - 1;
            } else {
                embed.addField(changeIcon + prefix + properties[key].fields[index].title, (embedValue !== '' ? embedValue : '‎'), true);
                count = count + 1;
            }

            // If count is equal to length then fill rest (until 3) with empty fields
            if (count === total && total !== 0) {
                for (let i = (total + 1); i <= 3; i++) {
                    // ‎  = empty/hidden character that still registers as a valid character
                    embed.addField('‎', '‎', true);
                }
            }
        }
    }
};
exports.buildstatsfield = buildstatsfield;

let buildstatscomparefield = (embed, data, property, type = 'fields') => {
    let key = gamemodes.modes[data.p1.data.gamemode][type][property];

    // Which p has a higher stat?
    let order = ['p1', 'p2'];

    if (properties[key] && properties[key].type !== 'combi') {
        order = (
            data.p1.properties.data[key] >= data.p2.properties.data[key] ?
                ['p1', 'p2'] : ['p2', 'p1']
        );

        let prefix = (properties[key].icon !== undefined ? properties[key].icon + ' ' : '');
        if (properties[key].type === 'level') {
            let embedValue = this.dehashUsername(data[order[0]].data.username) + ': ' + valueInType(data[order[0]].data.level + data[order[0]].data.prestige, 'int') +
                '\n' + this.dehashUsername(data[order[1]].data.username) + ': ' + valueInType(data[order[1]].data.level + data[order[1]].data.prestige, 'int');
            embed.addField(prefix + properties[key].title, embedValue !== '' ? embedValue : '‎');
        } else {
            let embedValue = this.dehashUsername(data[order[0]].data.username) + ': ' + valueInType(data[order[0]].properties.data[key], properties[key].type) +
                '\n' + this.dehashUsername(data[order[1]].data.username) + ': ' + valueInType(data[order[1]].properties.data[key], properties[key].type);
            embed.addField(prefix + properties[key].title, (embedValue !== '' ? embedValue : '‎'));
        }
    } else {
        let items = [];
        let count = 0;
        for (let index in properties[key].fields) {
            if (!properties[key].fields.hasOwnProperty(index)) {
                continue;
            }
            count = count + 1;

            order = (
                data.p1.properties.data[properties[key].fields[index].property] >= data.p2.properties.data[properties[key].fields[index].property] ?
                    ['p1', 'p2'] : ['p2', 'p1']
            );

            let prefix = (properties[properties[key].fields[index].property].icon ? properties[properties[key].fields[index].property].icon + ' ' : '');
            // let embedValue = valueInType(data.properties.data[properties[key].fields[index].property], properties[properties[key].fields[index].property].type);
            let embedValue = this.dehashUsername(data[order[0]].data.username) + ': ' + valueInType(data[order[0]].properties.data[properties[key].fields[index].property], properties[properties[key].fields[index].property].type) +
                '\n' + this.dehashUsername(data[order[1]].data.username) + ': ' + valueInType(data[order[1]].properties.data[properties[key].fields[index].property], properties[properties[key].fields[index].property].type);
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
};
exports.buildstatscomparefield = buildstatscomparefield;

let firstalias = (aliases) => {
    let options = [];
    let distinctoutcomes = Object.values(aliases).filter(distinct);

    for (let index in distinctoutcomes) {
        if (!distinctoutcomes.hasOwnProperty(index)) {
            continue;
        }

        let key = distinctoutcomes[index];
        let count = 0;
        for (let indexx in Object.keys(aliases)) {
            if (!Object.keys(aliases).hasOwnProperty(indexx)) {
                continue;
            }

            if (aliases[Object.keys(aliases)[indexx]] === key) {
                count = count + 1;
                if (count <= 1) {
                    options.push(Object.keys(aliases)[indexx]);
                }
            }

        }
    }

    return options;
};
exports.firstalias = firstalias;

let valueInType = (value, type) => {
    if (type === 'int') {
        return numberFormat(value, 0);
    } else if (type === 'cash') {
        return '$' + numberFormat(value * 1000, 0);
    } else if (type === 'perc' || type === 'customPerc') {
        return ((Math.round(value * 10000) / 100) + '%');
    } else if (type === 'milliseconds') {
        return secondsToDhms(value / 1000);
    } else if (type === 'seconds') {
        return secondsToDhms(value);
    } else if (type === 'double' || type === 'ratio') {
        return numberFormat(value, 2);
    } else {
        return value;
    }
};
exports.valueInType = valueInType;

let mention = (message, args) => {
    let found = -1;
    let mention = -1;
    for (let index in args) {
        if (!args.hasOwnProperty(index)) {
            continue;
        }

        if (args[index].startsWith('<@') && args[index].endsWith('>')) {
            mention = args[index].slice(2, -1);

            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }

            mention = bot.users.cache.get(mention);
            found = index;

            if (mention !== -1 && mention !== undefined) {
                args[found] = 'mention';
                args.splice(found + 1, 0, mention.id.toString());

                return this.mention(message, args);
            }
        }
    }

    return args;
};
exports.mention = mention;


let validate = (arguments, args) => {
    let input = {
        errors: {},
        processed: {},
        original: args,
    };

    let specials = [
        '@role',
    ];

    for (let index in Object.keys(arguments)) {
        if (!Object.keys(arguments).hasOwnProperty(index)) {
            continue;
        }

        if (arguments[Object.keys(arguments)[index]].lowercase && args[index] !== undefined && args[index] !== null) {
            args[index] = args[index].toLowerCase();
        }

        if (arguments[Object.keys(arguments)[index]].required && (args[index] === undefined || args[index] === null)) {
            input.errors[Object.keys(arguments)[index]] = '\nThis is a required argument';
            args[index] = '__*empty*__';
            // continue;
        } else if (args[index] === undefined || args[index] === null) {
            if (arguments[Object.keys(arguments)[index]].default) {
                args[index] = arguments[Object.keys(arguments)[index]].default;
            }
        }

        if (arguments[Object.keys(arguments)[index]].hasOwnProperty('options') && args[index] !== undefined && (!Object.keys(arguments[Object.keys(arguments)[index]].options).includes(args[index].toString()))) {
            // Check if the options for this argument have a special parameter (like @role)
            let foundspecials = Object.keys(arguments[Object.keys(arguments)[index]].options).filter((value) => specials.includes(value));
            let stillerror = true;

            if (foundspecials) {
                // Depending on the special do a custom check to process the argument
                for (let specialindex in foundspecials) {
                    if (foundspecials.hasOwnProperty(specialindex)) {
                        switch (foundspecials[specialindex]) {
                            case '@role':
                                // First check if there is a role mention for the current argument
                                if (args[index].toString().startsWith('<@&') && args[index].toString().endsWith('>') || args[index].toString().startsWith('role,')) {
                                    input.processed[Object.keys(arguments)[index]] = (args[index].toString().startsWith('role,') ? args[index] : 'role,' + args[index].slice(3, -1));
                                    stillerror = false;
                                    continue;
                                }
                                break;
                            default:
                            // code block
                        }
                    }
                }
            }

            if (stillerror) {
                input.errors[Object.keys(arguments)[index]] = '\nShould be one of the following options: `' + firstalias(arguments[Object.keys(arguments)[index]].options).join('`, `') + '`';
                args[index] = '__' + args[index] + '__';
                continue;
            }
        }

        input.processed[Object.keys(arguments)[index]] = input.processed[Object.keys(arguments)[index]] ? input.processed[Object.keys(arguments)[index]] : (arguments[Object.keys(arguments)[index]].options ? arguments[Object.keys(arguments)[index]].options[args[index]] : args[index]);
    }

    return input;
};
exports.validate = validate;

let getName = (search, type = 'gamemode') => {
    switch (type) {
        case 'gamemode':
            if (gamemodes.modes[search.toLowerCase()] !== undefined) {
                return (gamemodes.modes[search.toLowerCase()].title !== undefined ? gamemodes.modes[search.toLowerCase()].title : search);
            } else {
                return search.toLowerCase();
            }
            break;
        case 'property':
            if (properties[search] !== undefined) {
                return (properties[search].title !== undefined ? properties[search].title : search);
            } else {
                return search;
            }
            break;
        case 'maps':
            if (maps[search.toLowerCase()] !== undefined) {
                return (maps[search.toLowerCase()].title !== undefined ? maps[search.toLowerCase()].title : search.toLowerCase());
            } else {
                return search.toLowerCase();
            }
            break;
        case 'weapon':
            if (wpns.weapons[search.toLowerCase()] !== undefined) {
                return (wpns.weapons[search.toLowerCase()].label !== undefined ? wpns.weapons[search.toLowerCase()].label : search.toLowerCase());
            } else {
                return search.toLowerCase();
            }
            break;
        default:
            return search.toLowerCase();
    }
};
exports.getName = getName;


function distinct(value, index, self) {
    return self.indexOf(value) === index;
}

function pad(num, size) {
    var s = num + '';
    while (s.length < size) {
        s = '0' + s;
    }
    return s;
}

exports.pad = pad;

let HSLToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length == 1) {
        r = '0' + r;
    }
    if (g.length == 1) {
        g = '0' + g;
    }
    if (b.length == 1) {
        b = '0' + b;
    }

    return '#' + r + g + b;
};

let ordinalSuffix = (i) => {
    let j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + 'st';
    }
    if (j == 2 && k != 12) {
        return i + 'nd';
    }
    if (j == 3 && k != 13) {
        return i + 'rd';
    }
    return i + 'th';
};
exports.ordinalSuffix = ordinalSuffix;

let dehashUsername = (username, removeClanTag = false) => {
    if (removeClanTag && username.includes(']')) {
        username = /](.+)/.exec(username)[1];
    }

    if (!username.includes('#')) {
        return username;
    }

    return username.split('#')[0];
};
exports.dehashUsername = dehashUsername;

let numberFormat = (amount, decimalCount = 2, decimal = '.', thousands = ',') => {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? '-' : '';

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
    } catch (e) {
        console.log(e);
    }
};
exports.numberFormat = numberFormat;

let secondsToDhms = (seconds, withSeconds = false, shortHand = false) => {
    seconds = Number(seconds);
    if (seconds === 0) {
        return 'never';
    }

    let s = 0;
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor(seconds % (3600 * 24) / 3600);
    let m = Math.floor(seconds % 3600 / 60);
    if (withSeconds) {
        s = Math.floor(seconds % 60);
    }

    let display = [];
    display.push(d > 0 ? d + (shortHand ? 'd' : (d === 1 ? ' day' : ' days')) : '');
    display.push(h > 0 ? h + (shortHand ? 'h' : (h === 1 ? ' hour' : ' hours')) : '');
    display.push(m > 0 ? m + (shortHand ? 'm' : (m === 1 ? ' minute' : ' minutes')) : '');
    if (withSeconds) {
        display.push(s >= 0 ? s + (shortHand ? 's' : (s === 1 ? ' second' : ' seconds')) : '');
    }

    let filtered = display.filter((el) => {
        return el !== '';
    });

    return filtered.join((shortHand ? ' ' : ', '));
};
exports.secondsToDhms = secondsToDhms;

let positionToMedal = (position, forceText = false, withTrophy = false) => {
    position = Number(position);

    let medals = [];
    if (withTrophy) {
        medals = [
            ':trophy:',
            ':second_place:',
            ':third_place:',
            ':four:',
            ':five:',
            ':six:',
            ':seven:',
            ':eight:',
            ':nine:',
            ':keycap_ten:',
        ];
    } else {
        medals = [
            ':first_place:',
            ':second_place:',
            ':third_place:',
        ];
    }

    if (!forceText && position >= 1 && position <= medals.length) {
        return medals[position - 1];
    } else {
        return '**' + ordinalSuffix(position) + '**';
    }
};
exports.positionToMedal = positionToMedal;
