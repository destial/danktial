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
const client = new Discord.Client({
    partials: ["MESSAGE", "REACTION", "GUILD_MEMBER", "CHANNEL", "USER"],
});

client.login(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    try {
        if (client.shard.ids[0] === 0) {
            await client.user.setStatus('dnd');
        }
        const Manager = new ServerManager(client);
        const loadServer = new Promise((resolve, reject) => {
            client.guilds.cache.forEach((guild) => {
                Manager.fetch(guild.id).then(server => {
                    if (!server) {
                        const server = new Server(client, guild, undefined, '-', 0, Manager);
                        Manager.addServer(server).then(() => {}).catch((err) => console.log(err));
                    }
                });
            });
            resolve();
        });

        loadServer.then(async () => {
            Database.all(Database.serverQuery).then(serverRows => {
                serverRows.forEach((row) => {
                    try {
                        client.guilds.fetch(row.id).then(guild => {
                            Manager.fetch(guild.id).then(async server => {
                                if (guild && server) {
                                    const modlog = guild.channels.cache.find(c => c.id === row.log);
                                    server.load(guild, modlog, row.prefix, row.tickets);
                                } else if (!guild) {
                                    Database.run(Database.serverDeleteQuery, [row.id]).then(() => {}).catch((err) => console.log(err));
                                }
                            });
                        });
                    } catch(err) {
                        console.log(`[BOOT] Error loading server ${row.id}`);
                    }
                });

                client.shard.fetchClientValues('guilds.cache.size').then(results => {
                    const servers = results.reduce((acc, guildCount) => acc + guildCount, 0);
                    if (serverRows.length < servers) {
                        client.guilds.cache.forEach(async guild => {
                            try {
                                const exist = await Manager.fetch(guild.id);
                                if (!exist) {
                                    await Database.run(Database.serverSaveQuery, [guild.id, '-', 0, 0]);
                                    console.log(`[SERVER] Saved ${server.guild.name} to database`);
                                }
                            } catch(err) {
                                console.log(`[BOOT] Error loading server ${row.id}`);
                            }
                        });
                    }
                });
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
                            } else {
                                Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                            }
                        } else {
                            Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    } catch (err) {
                        console.log(`[BOOT] Error loading attendance ${row.id}`);
                        //Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
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
                        console.log(`[BOOT] Error loading ticket ${row.id}`);
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
                                    await server.getCountManager().setCount('member', channel);
                                    await channel.edit({
                                        name: `Member Count: ${server.guild.memberCount}`
                                    });
                                    console.log(`[COUNT] Loaded membercount channel from ${server.guild.name}`);
                                } else if (row.name === "rolecount") {
                                    await server.getCountManager().setCount('role', channel);
                                    await channel.edit({
                                        name: `Role Count: ${server.guild.roles.cache.size}`
                                    });
                                    console.log(`[COUNT] Loaded rolecount channel from ${server.guild.name}`);
                                } else if (row.name === "channelcount") {
                                    await server.getCountManager().setCount('channel', channel);
                                    await channel.edit({
                                        name: `Channel Count: ${server.guild.channels.cache.size}`
                                    });
                                    console.log(`[COUNT] Loaded channelcount channel from ${server.guild.name}`);
                                }
                            }
                        } else {
                            Database.run(Database.countDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    } catch (err) {
                        console.log(`[BOOT] Error loading count ${row.id}`);
                        //Database.run(Database.countDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
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
                                await server.getTicketManager().loadTicketPanel(ticketPanel);
                            } else {
                                Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                            }
                        } else {
                            Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    } catch (err) {
                        console.log(`[BOOT] Error loading ticketpanel ${row.id}`);
                        //Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                    }
                });
            });

            const loadTiers = new Promise((resolve, reject) => {
                Database.all(Database.tierQuery).then(tierRows => {
                    tierRows.forEach(async (row, index) => {
                        try {
                            const server = await Manager.fetch(row.guild);
                            if (server) {
                                const tier = new Tier(client, server, row.name);
                                server.getTierManager().addTier(tier);
                            } else {
                                Database.run(Database.tierDeleteQuery, [row.guild, row.name]).then(() => {}).catch(err => console.log(err));
                            }
                            if (index === tierRows.length-1) resolve();
                        } catch (err) {
                            console.log(`[BOOT] Error loading tier ${row.name}`);
                        }
                    });
                });
            });

            loadTiers.then(() => {
                const loadTeams = new Promise((resolve, reject) => {
                    Database.all(Database.teamQuery).then(teamRows => {
                        teamRows.forEach(async (row, index) => {
                            try {
                                const server = await Manager.fetch(row.guild);
                                if (server) {
                                    const tier = server.getTierManager().getTier(row.tier.toLowerCase());
                                    if (tier) {
                                        const team = new Team(client, server, row.name, tier);
                                        tier.addTeam(team);
                                    }
                                } else {
                                    Database.run(Database.teamDeleteQuery, [row.guild, row.name, row.tier]).then(() => {}).catch(err => console.log(err));
                                }
                                if (index === teamRows.length-1) resolve();
                            } catch(err) {
                                console.log(`[BOOT] Error loading team ${row.name}`);
                            }
                        });
                    });
                });

                loadTeams.then(() => {
                    const loadDrivers = new Promise((resolve, reject) => {
                        Database.all(Database.driverQuery).then(driverRows => {
                            driverRows.forEach(async (row, index) => {
                                try {
                                    const server = await Manager.fetch(row.guild);
                                    if (server) {
                                        const member = await server.guild.members.fetch(row.id);
                                        if (member) {
                                            const tier = server.getTierManager().getTier(row.tier.toLowerCase());
                                            if (tier) {
                                                const team = tier.teams.get(row.team.toLowerCase());
                                                const existingD = tier.getDriver(row.id);
                                                const existingR = tier.getReserve(row.id);
                                                if (row.reserved == 0 && team && !existingD) {
                                                    const driver = new Driver(client, member, server, team, row.number, tier);
                                                    tier.addDriver(driver);
                                                    team.setDriver(driver);
                                                    console.log(`[DRIVER] Loaded driver ${driver.name} into tier ${driver.tier.name} in ${driver.guild.name}`);
                                                } else if (row.reserved == 1 && !existingR) {
                                                    const reserve = new Reserve(client, member, server, row.number, tier);
                                                    tier.addReserve(reserve);
                                                    console.log(`[DRIVER] Loaded reserve ${reserve.name} into tier ${reserve.tier.name} in ${reserve.guild.name}`);
                                                } else if (existingD || existingR) {
                                                    Database.run(Database.driversDeleteQuery, [row.id, row.guild, row.tier]).then(() => {}).catch(err => console.log(err));
                                                }
                                                if (index === driverRows.length-1) resolve();
                                            }
                                        } else {
                                            Database.run(Database.driversDeleteQuery, [row.id, row.guild, row.tier]).then(() => {}).catch(err => console.log(err));
                                        }
                                    } else {
                                        Database.run(Database.driversDeleteQuery, [row.id, row.guild, row.tier]).then(() => {}).catch(err => console.log(err));
                                    }
                                } catch (err) { 
                                    console.log(`[BOOT] Error loading driver ${row.id}`);
                                }
                            });
                            if (driverRows.length === 0) {
                                resolve();
                            }
                        });
                    });

                    loadDrivers.then(() => {
                        Database.all(Database.advancedAttendanceQuery).then(attendanceRows => {
                            attendanceRows.forEach(async (row, index) => {
                                try {
                                    const channel = await client.channels.fetch(row.channel);
                                    if (channel && channel.isText()) {
                                        const message = await channel.messages.fetch(row.id);
                                        if (message) {
                                            const server = await Manager.fetch(message.guild.id);
                                            const date = new Date().setTime(row.date);
                                            const tier = server.getTierManager().getTier(row.tier.toLowerCase());
                                            if (tier) {
                                                await server.getAttendanceManager().loadAdvancedAttendance(message, tier, date);
                                                await channel.messages.fetch({after: message.id});
                                            } else {
                                                Database.run(Database.advancedAttendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                                            }
                                        } else {
                                            Database.run(Database.advancedAttendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                                        }
                                    } else {
                                        Database.run(Database.advancedAttendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                                    }
                                } catch (err) {
                                    console.log(`[BOOT] Error loading advancedattendance ${row.id}`);
                                }
                            });
                            const { Logger } = require('./utils/Utils');
                            Logger.log('danktial is now online!');
                        });
                        Manager.servers.forEach(server => {
                            server.log(`danktial has been restarted!`);
                        });
                        if (client.shard.ids[0] === 0) {
                            client.user.setStatus('online');
                            client.user.setActivity(`${Manager.servers.size} leagues`, { type: 'COMPETING' });
                        }
                    });
                });
            });

            const listenerFiles = fs.readdirSync('./listeners').filter(file => file.endsWith('.js'));
            for (const file of listenerFiles) {
                const listener = require(`./listeners/${file}`);
                await listener.run(client, Manager);
                if (client.shard.ids[0] === 0) {
                    console.log(`[LISTENER] Registered ${file.replace('.js', '')}`);
                }
            }
        });
    } catch(err) {
        console.log(err);
    } 
});