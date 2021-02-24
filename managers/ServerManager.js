const Discord = require('discord.js');
const Server = require('../items/Server');
const Database = require("../database/Database");
const QueueWorker = require('../database/QueueWorker');

class ServerManager {
    /**
     * 
     * @param {Discord.Client} client 
     */
    constructor(client) {
        /**
         * @type {Discord.Collection<string, Server>}
         */
        this.servers = new Discord.Collection();
        this.queueWorker = new QueueWorker(this);
        this.client = client;
    }

    /**
     * 
     * @param {Server} server
     */
    async addServer(server) {
        return new Promise(async (resolve, reject)  => {
            const s = await this.fetch(server.id);
            if (!s) {
                this.servers.set(server.id, server);
                console.log(`[SERVER] Added server ${server.guild.name} of id ${server.id}`);
                resolve(server);
            } else {
                reject();
            }
        });
    }

    /**
     * 
     * @param {Server} server 
     */
    async removeServer(server) {
        const deleted = this.servers.delete(server.id);
        if (deleted) {
            const attendanceRows = await Database.all(Database.attendanceQuery);
            attendanceRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.channel);
                    if (channel && channel.isText()) {
                        const message = await channel.messages.fetch(row.id);
                        if (message && message.guild.id === server.id) {
                            Database.run(Database.attendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const ticketRows = await Database.all(Database.ticketQuery);
            ticketRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.id);
                    if (channel && channel.isText()) {
                        const base = await channel.messages.fetch(row.base);
                        if (base && base.guild.id === server.id) {
                            Database.run(Database.ticketDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const countRows = await Database.all(Database.countQuery);
            countRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.id);
                    if (channel && channel.type === "voice" && channel.guild.id === server.id) {
                        Database.run(Database.countDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const panelRows = await Database.all(Database.ticketPanelQuery);
            panelRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.channel);
                    if (channel && channel.isText()) {
                        const panel = await channel.messages.fetch(row.id);
                        if (panel && panel.guild.id === server.id) {
                            Database.run(Database.ticketPanelDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const rrpanelRows = await Database.all(Database.reactionRolePanelQuery);
            rrpanelRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.channel);
                    if (channel && channel.isText()) {
                        const panel = await channel.messages.fetch(row.id);
                        if (panel && panel.guild.id === server.id) {
                            Database.run(Database.reactionRolePanelQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            const advancedRows = await Database.all(Database.advancedAttendanceQuery);
            advancedRows.forEach(async row => {
                try {
                    const channel = server.guild.channels.cache.get(row.channel);
                    if (channel && channel.isText()) {
                        const message = await channel.messages.fetch(row.id);
                        if (message && message.guild.id === server.id) {
                            Database.run(Database.advancedAttendanceDeleteQuery, [row.id]).then(() => {}).catch(err => console.log(err));
                        }
                    }
                } catch(err) {
                    console.log(err);
                }
            });

            await Database.run(Database.tierDeleteGuildQuery, [server.id]);
            await Database.run(Database.driversDeleteGuildQuery, [server.id]);
            await Database.run(Database.teamDeleteGuildQuery, [server.id]);
            await Database.run(Database.triggerDeleteGuildQuery, [server.id]);
            await Database.run(Database.reactionRoleDeleteGuildQuery, [server.id]);
            await Database.run(Database.serverEmbedDeleteQuery, [server.id]);

            await Database.run(Database.serverDeleteQuery, [server.id]);
            console.log(`[DELETED SERVER] Deleted server ${server.guild.name}`);
        }
    }

    /**
     * 
     * @param {string} id 
     * @returns {Promise<Server>}
     */
    fetch(id) {
        return new Promise((resolve, reject) => {
            const server = this.servers.get(id);
            resolve(server);
        });
    }
}

module.exports = ServerManager;