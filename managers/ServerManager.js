const Discord = require('discord.js');
const Server = require('../items/Server');
const QueueWorker = require('../database/QueueWorker');
const { Router } = require('express');
const AdvancedAttendance = require('../items/AdvancedAttendance');
const Team = require('../items/Team');
const Race = require('../items/Race');
const Tier = require('../items/Tier');
const RaceResult = require('../items/RaceResult');
const Driver = require('../items/Driver');

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
        //const deleted = this.servers.delete(server.id);
        //if (deleted) {
        //    await Database.runNewDB('DELETE FROM servers WHERE id=(?)', [server.id]);
        //    console.log(`[DELETED SERVER] Deleted server ${server.guild.name}`);
        //}
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
    async editServer(server, req) {
        switch (req.headers.type) {
            case 'set_prefix': {
                const oldPrefix = server.prefix;
                server.setPrefix(req.body.prefix);
                server.log(`Updated server prefix from ${oldPrefix} to ${server.prefix}`);
                break;
            }
            case 'transfer_driver': {
                const tier = server.getTierManager().getTier(req.body.tier);
                if (tier) {
                    const team = tier.getTeam(req.body.team);
                    if (team) {
                        tier.transferDriver(req.body.driver, team);
                        server.log(`Transferred driver of id ${req.body.driver} to team ${team.name} in tier ${tier.name}`);
                    }
                }
                break;
            }
            case 'delete_race': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const race = tier.races.find(r => r.name === req.body.name);
                if (race) {
                    if (race.results.length !== 0) break;
                    const index = tier.races.indexOf(race);
                    tier.races.splice(index, 1);
                    server.log(`Deleted race ${race.name} from tier ${tier.name}`);
                }
                break;
            }
            case 'new_raceresult': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const race = tier.races.find(r => r.name === req.body.race);
                const driver = tier.getDriver(req.body.driver);
                const result = new RaceResult(tier, driver, Number(req.body.position), Number(req.body.gap), Number(req.body.points), Number(req.body.stops), Number(req.body.penalties));
                race.results.push(result);
                server.log(`Created new race result for ${result.driver.name} in race ${race.name} in tier ${tier.name}`);
                break;
            }
            case 'update_raceresult': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const race = tier.races.find(r => r.name === req.body.race);
                const result = race.results.find(r => r.driver.id === req.body.driver);
                if (result) {
                    result.gap = Number(req.body.gap);
                    result.penalties = Number(req.body.penalties);
                    result.points = Number(req.body.points);
                    result.stops = Number(req.body.stops);
                    server.log(`Updated race result for ${result.driver.name} in race ${race.name} in tier ${tier.name}`);
                }
                break;
            }
            case 'delete_raceresult': {
                break;
            }
            case 'update_race': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const race = tier.races.find(r => r.name === req.body.old_name);
                if (race) {
                    race.link = req.body.link;
                    race.name = req.body.name;
                    race.date = new Date(req.body.date);
                    server.log(`Updated race ${race.name} in tier ${tier.name}`);
                }
                break;
            }
            case 'new_race': {
                const tier = server.getTierManager().getTier(req.body.tier);
                const race = new Race(tier, req.body.name, new Date(req.body.date), req.body.timezone);
                tier.races.push(race);
                tier.races.sort((a, b) => a.date.getTime() - b.date.getTime());
                server.log(`Created new race ${race.name} in tier ${tier.name}`);
                break;
            }
            case 'new_driver': {
                const member = await server.guild.members.fetch(req.body.driver);
                if (member) {
                    const tier = server.getTierManager().getTier(req.body.tier);
                    var team = undefined;
                    if (req.body.team !== "Reserves") {
                        team = tier.getTeam(req.body.team);
                    }
                    const driver = new Driver(client, member, server, team, req.body.number, tier);
                    if (team) {
                        team.setDriver(driver);
                    } else {
                        tier.addReserve(driver);
                    }
                    tier.addDriver(driver);
                    server.log(`Created new driver ${driver.name} in tier ${tier.name}`)
                }
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
                const tier = new Tier(client, server, req.body.name);
                server.getTierManager().addTier(tier);
                server.log(`Created new tier ${tier.name}`);
                break;
            }
            case 'delete_tier': {
                const tier = server.getTierManager().getTier(req.body.name.replace("_", " "));
                if (tier) {
                    if (tier.teams.size !== 0) break;
                    if (tier.reserves.size !== 0) break;
                    server.getTierManager().removeTier(tier);
                    server.log(`Deleted tier ${tier.name}`);
                }
                break;
            }
            case 'edit_tier': {
                const oldTierName = req.body.old_name;
                const newTierName = req.body.new_name;
                const tier = server.getTierManager().getTier(oldTierName);
                if (tier) {
                    tier.setName(newTierName);
                    server.log(`Updated tier ${oldTierName} to ${tier.name}`);
                }
                break;
            }
            case 'new_team': {
                const tier = server.getTierManager().getTier(req.body.tier.replace("_", " "));
                if (tier) {
                    const team = new Team(client, server, req.body.team, tier);
                    tier.addTeam(team);
                    server.log(`Added team ${team.name} to tier ${tier.name}`);
                }
                break;
            }
            case 'delete_team': {
                const tier = server.getTierManager().getTier(req.body.tier.replace("_", " "));
                if (tier) {
                    const team = tier.getTeam(req.body.team);
                    if (team) {
                        tier.removeTeam(team.name);
                        server.log(`Removed team ${team.name} from tier ${tier.name}`);
                    }
                }
                break;
            }
            case 'edit_team' : {
                const tier = server.getTierManager().getTier(req.body.tier.replace("_", " "));
                if (tier) {
                    const teamName = req.body.old_name;
                    const team = tier.getTeam(teamName);
                    if (team) {
                        team.setName(req.body.new_name);
                        server.log(`Updated team ${teamName} to ${team.name} in tier ${tier.name}`);
                    }
                }
                break;
            }
            default: {
                break;
            }
        }
        server.save();
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