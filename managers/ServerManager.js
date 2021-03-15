const Discord = require('discord.js');
const Server = require('../items/Server');
const Database = require("../database/Database");
const QueueWorker = require('../database/QueueWorker');
const { Router } = require('express');

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

        setInterval(() => {
            this.servers.forEach(server => {
                server.backup();
            });
        }, 1000 * 60 * 60 * 3);

        if (this.client.app) {
            this.guildRoute = Router();
            this.guildRoute.post('/:guildID', (req, res, next) => {
                if (req.headers.token === this.client.token) {
                    const { guildID } = req.params;
                    const server = this.servers.get(guildID);
                    if (server) {
                        switch (req.headers.type) {
                            case 'prefix': {
                                server.setPrefix(req.body.prefix);
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                        res.status(200).send({
                            success: 'Success!',
                            code: 200,
                        });
                    } else {
                        res.status(404).send({
                            error: 'Invalid guildID',
                            code: 404,
                        });
                    }
                } else {
                    res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
                next();
            });

            this.guildRoute.get('/:guildID', (req, res, next) => {
                if (req.headers.token === this.client.token) {
                    const { guildID } = req.params;
                    const server = this.servers.get(guildID);
                    if (server) {
                        res.send(server.toJSON());
                    } else {
                        res.status(404).send({
                            error: 'Invalid guildID',
                            code: 404,
                        });
                    }
                } else {
                    res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
                next();
            });

            this.guildRoute.get('/:guildID/members/', async (req, res, next) => {
                if (req.headers.token === this.client.token) {
                    const { guildID } = req.params;
                    const server = this.servers.get(guildID);
                    if (server) {
                        try {
                            await server.guild.members.fetch();
                            const array = [];
                            for (const member of server.guild.members.cache.values()) {
                                const data = {
                                    member: member.toJSON(),
                                    hasPermission: member.hasPermission('MANAGE_GUILD')
                                };
                                array.push(data);
                            }
                            res.send(array);
                        } catch(err) {
                            res.status(404).send({
                                error: 'Invalid memberID',
                                code: 404,
                            });
                        }
                    } else {
                        res.status(404).send({
                            error: 'Invalid guildID',
                            code: 404,
                        });
                    }
                } else {
                    res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
                next();
            });

            this.guildRoute.get('/:guildID/members/:memberID', async (req, res, next) => {
                if (req.headers.token === this.client.token) {
                    const { guildID, memberID } = req.params;
                    const server = this.servers.get(guildID);
                    if (server) {
                        try {
                            const member = await server.guild.members.fetch(memberID);
                            if (member) {
                                const data = {
                                    member: member.toJSON(),
                                    hasPermission: member.hasPermission('MANAGE_GUILD')
                                };
                                res.send(data);
                            }
                        } catch(err) {
                            res.status(404).send({
                                error: 'Invalid memberID',
                                code: 404,
                            });
                        }
                    } else {
                        res.status(404).send({
                            error: 'Invalid guildID',
                            code: 404,
                        });
                    }
                } else {
                    res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
                next();
            });

            this.guildRoute.get('/', (req, res) => {
                if (req.headers.token === this.client.token) {
                    const serverArray = [];
                    this.servers.forEach(server => {
                        serverArray.push(server.toJSON());
                    });
                    res.send(serverArray);
                } else {
                    res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
            });

            this.client.app.use('/api/discord/guilds', this.guildRoute);
        }
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
            await Database.runNewDB('DELETE FROM servers WHERE id=(?)', [server.id]);
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