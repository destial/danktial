const Discord = require('discord.js');
const Server = require('../items/Server');
const Database = require("../database/Database");
const QueueWorker = require('../database/QueueWorker');
const { Router } = require('express');
const Racer = require('../items/Racer');
const AdvancedAttendance = require('../items/AdvancedAttendance');

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

        /**
         * @type {Discord.Collection<string, Racer>}
         */
        this.racers = new Discord.Collection();
        this.queueWorker = new QueueWorker(this);
        this.client = client;

        setInterval(() => {
            this.servers.forEach(server => {
                server.backup();
            });
        }, 1000 * 60 * 60 * 3);

        if (this.client.app) {
            this.guildRoute = Router();
            this.guildRoute.post('/:guildID', async (req, res) => {
                const { guildID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    const members = await server.guild.members.fetch();
                    const member = members.get(req.headers.id);
                    if (member && member.hasPermission('MANAGE_GUILD')) {
                        this.editServer(server, req);
                        return res.status(200).send({
                            success: 'Success!',
                            code: 200,
                        });
                    }
                } else if (!server && req.headers.id) {
                    return res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.get('/:guildID', async (req, res) => {
                const { guildID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    const members = await server.guild.members.fetch();
                    const member = members.get(req.headers.id);
                    if (member && member.hasPermission('MANAGE_GUILD')) {
                        return res.send(server.toJSON());
                    }
                    return res.status(403).send({
                        error: 'Unauthorized access',
                        code: 403,
                    });
                }
                return res.status(404).send({
                    error: 'Invalid guildID',
                    code: 404,
                });
            });

            this.guildRoute.get('/:guildID/members/', async (req, res) => {
                const { guildID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    try {
                        const members = await server.guild.members.fetch();
                        const member = members.get(req.headers.id);
                        if (member && member.hasPermission('MANAGE_GUILD')) {
                            const array = [];
                            for (const member of server.guild.members.cache.values()) {
                                array.push(member.toJSON());
                            }
                            return res.send(array);
                        }
                    } catch(err) {
                        return res.status(404).send({
                            error: 'Invalid memberID',
                            code: 404,
                        });
                    }
                }
                else if (!server && req.headers.id) {
                    return res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.get('/:guildID/attendances/', async (req, res) => {
                const { guildID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    try {
                        const members = await server.guild.members.fetch();
                        const member = members.get(req.headers.id);
                        if (member && member.hasPermission('MANAGE_GUILD')) {
                            const array = [];
                            for (const attendance of server.getAttendanceManager().getAdvancedEvents().values()) {
                                array.push(attendance.toJSON());
                            }
                            return res.send(array);
                        }
                    } catch(err) {
                        return res.status(404).send({
                            error: 'Invalid member',
                            code: 404,
                        });
                    }
                }
                else if (!server && req.headers.id) {
                    return res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.get('/:guildID/attendances/:attendanceID', async (req, res) => {
                const { guildID, attendanceID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    try {
                        const members = await server.guild.members.fetch();
                        const member = members.get(req.headers.id);
                        if (member && member.hasPermission('MANAGE_GUILD')) {
                            const attendance = server.getAttendanceManager().fetchAdvanced(attendanceID);
                            if (attendance) {
                                return res.send(attendance.toJSON());
                            }
                            return res.status(404).send({
                                error: 'Invalid attendanceID',
                                code: 404,
                            });
                        }
                    } catch(err) {
                        return res.status(404).send({
                            error: 'Invalid member',
                            code: 404,
                        });
                    }
                } else if (!server && req.headers.id) {
                    res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.post('/:guildID/attendances/:attendanceID', async (req, res) => {
                const { guildID, attendanceID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    try {
                        const members = await server.guild.members.fetch();
                        const member = members.get(req.headers.id);
                        if (member) {
                            const attendance = server.getAttendanceManager().fetchAdvanced(attendanceID);
                            if (attendance) {
                                this.attendanceMark(member.id, attendance, attendance.tier.name, server, req);
                                return res.status(200).send({
                                    success: 'Success!',
                                    code: 200,
                                });
                            }
                            return res.status(404).send({
                                error: 'Invalid attendanceID',
                                code: 404,
                            });
                        }
                    } catch(err) {
                        return res.status(404).send({
                            error: 'Invalid member',
                            code: 404,
                        });
                    }
                } else if (!server && req.headers.id) {
                    res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.get('/:guildID/members/:memberID', async (req, res) => {
                const { guildID, memberID } = req.params;
                const server = this.servers.get(guildID);
                if (server && req.headers.id) {
                    try {
                        const members = await server.guild.members.fetch();
                        const member = members.get(req.headers.id);
                        if (member && member.hasPermission('MANAGE_GUILD')) {
                            const requestMember = members.get(memberID);
                            if (requestMember) {
                                return res.send(requestMember.toJSON());
                            }
                            return res.status(404).send({
                                error: 'Invalid memberID',
                                code: 404,
                            });
                        }
                    } catch(err) {
                        return res.status(404).send({
                            error: 'Invalid member',
                            code: 404,
                        });
                    }
                } else if (!server && req.headers.id) {
                    res.status(404).send({
                        error: 'Invalid guildID',
                        code: 404,
                    });
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
            });

            this.guildRoute.get('/', (req, res) => {
                if (req.headers.token === this.client.token) {
                    const serverArray = [];
                    this.servers.forEach(server => {
                        serverArray.push(server.toJSON());
                    });
                    return res.send(serverArray);
                }
                return res.status(403).send({
                    error: 'Unauthorized access',
                    code: 403,
                });
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

    /**
     * 
     * @param {Server} server 
     * @param {*} req 
     */
    editServer(server, req) {
        switch (req.headers.type) {
            case 'set_prefix': {
                server.setPrefix(req.body.prefix);
                break;
            }
            case 'transfer_driver': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const team = tier.getTeam(req.body.team);
                tier.transferDriver(req.body.driver, team);
                break;
            }
            case 'new_driver': {
                break;
            }
            case 'remove_driver': {
                break;
            }
            case 'new_advanced_attendance': {
                break;
            }
            case 'new_attendance': {
                break;
            }
            case 'new_tier': {
                break;
            }
            case 'delete_tier': {
                break;
            }
            case 'edit_tier': {
                const oldTierName = req.body.old_name;
                const newTierName = req.body.new_name;
                const tier = server.getTierManager().getTier(oldTierName);
                if (tier) {
                    tier.setName(newTierName);
                }
                break;
            }
            case 'new_team': {
                break;
            }
            case 'delete_team': {
                
            }
            default: {
                break;
            }
        }
    }

    /**
     * 
     * @param {string} userID 
     * @param {AdvancedAttendance} attendance
     * @param {string} tier
     * @param {Server} server 
     * @param {*} req 
     */
    attendanceMark(userID, attendance, tier, server, req) {
        var driver = server.getTierManager().getTier(tier).getDriver(userID);
        if (!driver) {
            driver = server.getTierManager().getTier(tier).getReserve(userID);
        }
        if (driver) {
            switch (req.headers.type) {
                case 'mark_in': {
                    attendance.accept(driver);
                    break;
                }
                case 'mark_out': {
                    attendance.reject(driver);
                    break;
                }
                default: {
                    attendance.maybe(driver);
                    break;
                }
            }
        }
    }
}

module.exports = ServerManager;