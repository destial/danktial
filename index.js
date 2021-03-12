require('dotenv').config();
const Discord = require('discord.js');
const Database = require('./database/Database');
const Server = require('./items/Server');
const ServerManager = require('./managers/ServerManager');
const fs = require('fs');
const { Logger } = require('./utils/Utils');
const formatDiscordRegion = require('./utils/formatDiscordRegion');
const express = require('express');
const app = express();
app.use(express.json());

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
                if (id === client.guilds.cache.last().id) resolve();
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
            client.guilds.cache.forEach(async (guild, id) => {
                guild.channels.cache.forEach(async (channel) => {
                    if (channel.isText() && channel.manageable && channel.viewable) {
                        try {
                            await channel.messages.fetch({limit: 100});
                        } catch(err) {
                            Logger.warn(`Error loading channel messages of ${channel.name} under ${channel.guild.name}`);
                        }
                    }
                });
                if (id === client.guilds.cache.last().id) {
                    Logger.boot(`Cached all messages!`);
                }
            });
        });
    } catch(err) {
        console.log(err);
    } 
});

app.post('/streams', (req, res) => {
    if (req.headers['client_id'] === process.env.DISCORD_TOKEN) {
        client.manager.servers.forEach(server => {
            if (server.alertChannel) {
                const { body } = req;
                const { stream } = body;
                if (server.subbedChannels.find(body.to_id)) {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`${stream.name} is now live!`, stream.profile, `https://www.twitch.tv/${stream.name}`);
                    embed.setTitle(stream.title);
                    embed.setURL(`https://www.twitch.tv/${stream.name}`);
                    embed.addFields([
                        { name: 'Playing', value: stream.game, inline: true }
                    ]);
                    embed.setImage(stream.thumbnail);
                    embed.setColor('DARK_PURPLE');
                    embed.setThumbnail(stream.profile);
                    embed.setTimestamp(stream.startedAt);
                    server.alertChannel.send(embed);
                }
            }
        });
    }
    res.status(200).end();
});

app.get('/', (req, res) => {
    console.log('ok');
    res.send('ok');
    res.status(200).end();
});

app.listen(3001, () => {
    console.log(`[API FETCHER] Started webserver`);
});