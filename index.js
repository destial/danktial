require('dotenv').config();
const Discord = require('discord.js');
const Database = require('./database/Database');
const Server = require('./items/Server');
const ServerManager = require('./managers/ServerManager');
const fs = require('fs');
const { Logger } = require('./utils/Utils');
const formatDiscordRegion = require('./utils/formatDiscordRegion');
const express = require('express');
const { scheduleJob, RecurrenceRule } = require('node-schedule');
const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "GUILD_MEMBER", "CHANNEL", "USER"],
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES' ,'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_BANS']
});
const client2 = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "GUILD_MEMBER", "CHANNEL", "USER"],
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'DIRECT_MESSAGES' ,'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_BANS']
});
// require('discord-buttons')(client, client2);

client.client2 = client2;

const dateNow = new Date();
const now = `./logs/${dateNow.getTime()}.log`.replace(':', '.');

const log = console.log;

console.log = function(object) {
    fs.appendFile('./logs/latest.log', `${object}\n`, 'utf-8', () => {
        log(object);
    });
    return object;
}

client.setMaxListeners(15);
client.client2.setMaxListeners(15);
/**
 * @type {express.Application}
 */
client.app = express();
client.app.use(express.json());
client.manager = new ServerManager(client);
client.app.listen(process.env.PORT);
client.client2.app = client.app;
client.client2.manager = client.manager;
var client1_loaded = false;
var client2_loaded = false;

client.once('ready', () => {
    try {
        const loadServer = new Promise((resolve, reject) => {
            client.guilds.cache.forEach((guild, id) => {
                if (client.guilds.cache.size === 0) 
                    resolve();
    
                const server = client.manager.servers.get(guild.id);
                if (!server) {
                    const server = new Server(client, guild, undefined, '-', 0, client.manager);
                    client.manager.servers.set(server.id, server);
                }
                if (id === client.guilds.cache.last().id) 
                    resolve();
            });
        });
        loadServer.then(async () => {
            client1_loaded = true;
            setup();
        });
    } catch (err) {
        client.manager.debug(err.message);
    }
});

client.client2.once('ready', () => {
    try {
        const loadServer = new Promise((resolve, reject) => {
            if (client.client2.guilds.cache.size === 0) 
                resolve();
            
            client.client2.guilds.cache.forEach((guild, id) => {
                const server = client.manager.servers.get(guild.id);
                if (!server) {
                    const server = new Server(client.client2, guild, undefined, '-', 0, client.manager);
                    client.manager.servers.set(server.id, server);
                }
                if (id === client.client2.guilds.cache.last().id) 
                    resolve();
            });
        });
        loadServer.then(() => {
            client2_loaded = true;
            setup();
        });
    } catch(err) {
        client.manager.debug(err.message);
    } 
});

const setup = () => {
    return new Promise(async (resolve, reject) => {
        if (client1_loaded && client2_loaded) {
            const rows = await Database.allNewDB('SELECT * FROM servers')
            for (const row of rows) {
                try {
                    client.manager.all.push(row.id);
                    var guild = await client.guilds.fetch(row.id);
                    if (!guild) {
                        guild = await client.client2.guilds.fetch(row.id);
                    }
                    if (guild) {
                        const server = await client.manager.fetch(guild.id)
                        server.loadData(JSON.parse(row.data));
                    }
                } catch(err) {}
            }
            client.user.setActivity(`destial.xyz | ${client.manager.all.length} leagues`);
            Logger.log('danktial is now online!');

            client.client2.user.setActivity(`destial.xyz | ${client.manager.all.length} leagues`);
            Logger.log('danktial2 is now online!');

            client.manager.servers.forEach(server => {
                if (server.modlog) {
                    const locale = formatDiscordRegion(server.guild.region);
                    const d = new Date();
                    const date = d.toLocaleDateString('en-US', { timeZone: locale, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                    const time = d.toLocaleTimeString('en-US', { timeZone: locale, hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
                    try {
                        server.modlog.setTopic(`danktial has been online since ${date} ${(time.startsWith('0') ? time.substring(1) : time)} ${server.guild.region.toLocaleUpperCase()}`);
                    } catch(err) {}
                }
            });

            const rule = new RecurrenceRule();
            rule.minute = 30;
            scheduleJob(rule, () => {
                client.user.setActivity(`destial.xyz | ${client.manager.all.length} leagues`);
                client.client2.user.setActivity(`destial.xyz | ${client.manager.all.length} leagues`);
            });
            resolve();
        }
    });
}

const listenerFiles = fs.readdirSync('./listeners').filter(file => file.endsWith('.js'));
for (const file of listenerFiles) {
    const listener = require(`./listeners/${file}`);
    listener.run(client, client.manager);
    listener.run(client.client2, client.manager);
    Logger.boot(`[LISTENER] Registered ${file.replace('.js', '')} for both clients`);
}

client.login(process.env.DISCORD_TOKEN);
client.client2.login(process.env.DISCORD_TOKEN2);

process.on('uncaughtException', (err) => {
    console.log(err);
    client.manager.debug(err ? err.message : `Uncaught exception! ${err}`);
});

process.on('unhandledRejection', (err) => {
    console.log(err);
    client.manager.debug(`Uncaught rejection! ${err}`);
});

process.on('beforeExit', (code) => {
	fs.renameSync('./logs/latest.log', now);
});