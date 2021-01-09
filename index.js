require('dotenv').config();
const Discord = require('discord.js');
const Database = require('./database/Database');
const Server = require('./items/Server');
const ServerManager = require('./managers/ServerManager');
const fs = require('fs');
const Ticket = require('./items/Ticket');
const TicketPanel = require('./items/TicketPanel');
const client = new Discord.Client( {partials: ["MESSAGE", "REACTION", "GUILD_MEMBER", "CHANNEL", "USER"]});

client.login(process.env.DISCORD_TOKEN);

const Manager = new ServerManager(client);

client.once('ready', async () => {
    client.guilds.cache.forEach(guild => {
        Manager.fetch(guild.id).then(async server => {
            if (!server) {
                const server = new Server(client, guild, undefined, '-', 0, Manager);
                await Manager.addServer(server);
            }
        });
    });

    Database.all(Database.serverQuery).then(serverRows => {
        serverRows.forEach((row) => {
            client.guilds.fetch(row.id).then(guild => {
                Manager.fetch(guild.id).then(async server => {
                    if (guild && server) {
                        const modlog = guild.channels.cache.find(c => c.id === row.log);
                        server.load(guild, modlog, row.prefix, row.tickets);
                        await server.save();
                        Manager.addServer(server).then(() => {}).catch(err => {});
                    } else if (!guild) {
                        Database.run(Database.serverDeleteQuery, [row.id]).then(() => {}).catch((err) => console.log(err));
                    }
                });
            });
        });
        if (serverRows.length !== client.guilds.cache.size) {
            client.guilds.cache.forEach(guild => {
                Manager.fetch(guild.id).then(async server => {
                    await Database.run(Database.serverSaveQuery, [server.id, server.prefix, server.getTicketManager().totaltickets, (server.modlog ? server.modlog.id : 0)]);
                    console.log(`[SERVER] Saved ${server.guild.name} to database`);
                });
            });
        }
    });

    Database.all(Database.attendanceQuery).then(attendanceRows => {
        attendanceRows.forEach(async row => {
            try {
                const channel = await client.channels.fetch(row.channel);
                if (channel && channel.isText()) {
                    const message = await channel.messages.fetch(row.id);
                    if (message) {
                        const server = await Manager.fetch(message.guild.id);
                        const date = new Date().setTime(row.date);
                        server.getAttendanceManager().loadAttendance(message, date);
                    }
                } else {
                    Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                }
            } catch (err) {
                Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
            }
        });
    });

    Database.all(Database.ticketQuery).then(ticketRows => {
        ticketRows.forEach(async row => {
            try {
                const channel = await client.channels.fetch(row.id);
                if (channel && channel.isText()) {
                    const base = await channel.messages.fetch(row.base);
                    if (base) {
                        const server = await Manager.fetch(base.guild.id);
                        const member = await server.guild.members.fetch(row.member);
                        if (member) {
                            const ticket = new Ticket(member, row.number, channel, base, server.getTicketManager());
                            server.getTicketManager().loadTicket(ticket);
                        }
                    }
                } else {
                    Database.run(Database.ticketDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                }
            } catch (err) {
                Database.run(Database.ticketDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
            }
        });
    });

    Database.all(Database.countQuery).then(countRows => {
        countRows.forEach(async row => {
            try {
                const channel = await client.channels.fetch(row.id);
                if (channel && channel.type === "voice") {
                    const server = await Manager.fetch(channel.guild.id);
                    if (server) {
                        if (row.name === "membercount") {
                            server.getCountManager().setCount('member', channel);
                        } else if (row.name === "rolecount") {
                            server.getCountManager().setCount('role', channel);
                        } else if (row.name === "channelcount") {
                            server.getCountManager().setCount('channel', channel);
                        }
                    }
                } else {
                    Database.run(Database.countDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                }
            }   catch (err) {
                Database.run(Database.countDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
            }
        });
    });

    Database.all(Database.ticketPanelQuery).then(panelRows => {
        panelRows.forEach(async row => {
            try {
                const channel = await client.channels.fetch(row.channel);
                if (channel && channel.isText()) {
                    const panel = await channel.messages.fetch(row.id);
                    if (panel) {
                        const server = await Manager.fetch(channel.guild.id);
                        const ticketPanel = new TicketPanel(client, server.getTicketManager(), panel.id, panel.embeds[0], channel);
                        server.getTicketManager().loadTicketPanel(ticketPanel);
                    } else {
                        Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                    }
                } else {
                    Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                }
            } catch (err) {
                Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
            }
        });
    });

    const listenerFiles = fs.readdirSync('./listeners').filter(file => file.endsWith('.js'));
    for (const file of listenerFiles) {
        const listener = require(`./listeners/${file}`);
        listener.run(client, Manager).then(() => {}).catch(() => {});
    }

    setInterval(async () => {
        const server = Manager.servers.random();
        await client.user.setActivity(server.guild.name, { type: 'COMPETING' });
    }, 1000*60*3);
});