require('dotenv').config();
const Discord = require('discord.js');
const Database = require('./database/Database');
const Server = require('./items/Server');
const ServerManager = require('./managers/ServerManager');
const fs = require('fs');
const Ticket = require('./items/Ticket');
const TicketPanel = require('./items/TicketPanel');
const Tier = require('./items/Tier');
const Driver = require('./items/Driver');
const Team = require('./items/Team');
const Reserve = require('./items/Reserve');
const { Logger } = require('./utils/Utils');
const formatDiscordRegion = require('./utils/formatDiscordRegion');

const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "GUILD_MEMBER", "CHANNEL", "USER"],
});

client.login(process.env.DISCORD_TOKEN);
client.setMaxListeners(15);
client.manager = new ServerManager(client);
client.once('ready', () => {
    try {
        const loadServer = new Promise((resolve, reject) => {
            client.guilds.cache.forEach((guild, id) => {
                client.manager.fetch(guild.id).then(server => {
                    if (!server) {
                        const server = new Server(client, guild, undefined, '-', 0, client.manager);
                        client.manager.addServer(server).then(() => {}).catch((err) => console.log(err));
                    }
                });
                guild.channels.cache.forEach(channel => {
                    if (channel.isText() && channel.manageable && channel.viewable) {
                        try {
                            channel.messages.fetch({limit: 100}, true);
                        } catch(err) {
                            Logger.boot(`Error loading channel messages of ${channel.name} under ${channel.guild.name}`);
                        }
                    }
                });
                if (id === client.guilds.cache.last().id) {
                    resolve();
                }
            });
        });

        loadServer.then(async () => {
            const loadServerData = new Promise((resolve, reject) => {
                Database.allNewDB('SELECT * FROM servers').then(rows => {
                    rows.forEach((row, index) => {
                        try {
                            client.guilds.fetch(row.id).then(guild => {
                                client.manager.fetch(guild.id).then(async server => {
                                    if (guild && server) {
                                        await server.loadData(JSON.parse(row.data));
                                    }
                                });
                            }).catch(err => {
                                Database.runNewDB('DELETE FROM servers WHERE id=(?)', [row.id]);
                            });
                        } catch(err) {
                            console.log(`[BOOT] Error loading server ${row.id}`);
                        }
                        if (index === rows.length-1) {
                            resolve();
                        }
                    });
                });
            });
            loadServerData.then(() => {
                client.user.setActivity(`${client.manager.servers.size} leagues`, { type: 'COMPETING' });
                Logger.log('danktial is now online!');
                client.manager.servers.forEach(async server => {
                    if (server.modlog) {
                        const locale = formatDiscordRegion(server.guild.region);
                        const date = new Date().toLocaleDateString('en-US', { timeZone: locale, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                        const time = new Date().toLocaleTimeString('en-US', { timeZone: locale, hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
                        await server.modlog.setTopic(`danktial has been online since ${date} ${(time.startsWith('0') ? time.substring(1) : time)} ${server.guild.region.toLocaleUpperCase()}`);
                    }
                });
            });
            
            const listenerFiles = fs.readdirSync('./listeners').filter(file => file.endsWith('.js'));
            for (const file of listenerFiles) {
                const listener = require(`./listeners/${file}`);
                await listener.run(client, client.manager);
                console.log(`[LISTENER] Registered ${file.replace('.js', '')}`);
            }
        });
    } catch(err) {
        console.log(err);
    } 
});