const Discord = require('discord.js');
const Database = require('../database/Database');
const Query = require('../database/Query');
const { Logger } = require('../utils/Utils');
const Driver = require('./Driver');
const Race = require('./Race');
const Reserve = require('./Reserve');
const Server = require('./Server');
const Team = require('./Team');

class Tier {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server
     * @param {string} name
     */
    constructor(client, server, name) {
        this.client = client;
        this.server = server;
        /**
         * @type {Discord.Collection<string, Reserve>}
         */
        this.reserves = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, Team>}
         */
        this.teams = new Discord.Collection();

        /**
         * @type {Race[]}
         */
        this.races = [];

        this.name = name;
        Logger.info(`[TIER] Added tier ${this.name} from ${this.server.guild.name}`);
    }

    async save() {
        await Database.run(Database.tierSaveQuery, [this.server.id, this.name]);
        Logger.info(`[TIER] Saved tier ${this.name} from ${this.server.guild.name}`);
    }

    async saveTeams() {
        const queries = [];
        this.teams.forEach(team => {
            const args = [team.server.id, team.name, team.tier.name];
            const query = new Query(Database.teamSaveQuery, args);
            queries.push(query);
        });
        await Database.multipleRun(queries);
    }

    /**
     * 
     * @param {string} newname 
     */
    async update(newname) {
        await Database.run(Database.tierUpdateQuery, [newname, this.server.id, this.name]);
        this.name = newname;
        Logger.info(`[TIER] Updated tier ${this.name} from ${this.server.guild.name}`);
    }

    async delete() {
        await Database.run(Database.tierDeleteQuery, [this.server.id, this.name]);
        Logger.warn(`[TIER] Deleted tier ${this.name} from ${this.server.guild.name}`);
    }

    async clear() {
        const promise = new Promise((resolve, reject) => {
            this.teams.forEach(team => {
                const deleteDrivers = new Promise((resolve1, reject1) => {
                    team.drivers.forEach(async (driver, id) => {
                        await driver.delete();
                        driver.setTeam(undefined);
                        driver.setTier(undefined);
                        team.removeDriver(driver.id);
                        if (id === team.drivers.lastKey()) resolve1();
                    });
                    if (team.drivers.size === 0) resolve1();
                });
                deleteDrivers.then(() => {});
            });
            const deleteReserves = new Promise((resolve1, reject1) => {
                this.reserves.forEach(async (reserve, id) => {
                    await reserve.delete();
                    reserve.setTier(undefined);
                    if (id === this.reserves.lastKey()) resolve1();
                });
                if (this.reserves.size === 0) resolve1();
            });
            deleteReserves.then(() => {
                this.reserves.clear();
                resolve();
            });
        });
        return promise;
    }

    /**
     * 
     * @param {Driver} driver 
     */
    addDriver(driver) {
        
    }

    /**
     * 
     * @param {Driver} driver 
     */
    loadDriver(driver) {
        
    }

    /**
     * 
     * @param {string} id 
     */
    removeDriver(id) {
        
    }

    /**
     * 
     * @param {Reserve | Driver} reserve 
     */
    addReserve(reserve) {
        if (!this.reserves.get(reserve.id)) {
            this.reserves.set(reserve.id, reserve);
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removeReserve(id) {
        this.reserves.delete(id);
    }

    /**
     * 
     * @param {Team} team 
     */
    addTeam(team) {
        if (!this.teams.get(team.name.toLowerCase())) {
            this.teams.set(team.name.toLowerCase(), team);
            Logger.info(`[TEAM] Added team ${team.name} from ${this.server.guild.name} to ${this.name}`);
        }
    }

    /**
     * 
     * @param {string} name 
     */
    removeTeam(name) {
        this.teams.delete(name.toLowerCase());
    }

    /**
     * @param {string} name
     */
    getTeam(name) {
        return this.teams.get(name.toLowerCase());
    }

    /**
     * @param {string} name
     */
    searchTeam(name) {
        return this.teams.filter(team => team.name.toLowerCase().includes(name.toLowerCase()));
    }

    /**
     * 
     * @param {string} id 
     */
    getDriver(id) {
        for (const reserve of this.reserves) {
            if (reserve[1].id === id) return reserve[1];
        }
        for (const team of this.teams) {
            for (const driver of team[1].drivers) {
                if (driver[1].id === id) return driver[1];
            }
        }
    }

    /**
     * 
     * @param {string} id 
     */
    getReserve(id) {
        return this.reserves.get(id);
    }

    async setName(newName) {
        if (newName) {
            this.server.getTierManager().tiers.delete(this.name.toLowerCase());
            this.name = newName;
            this.server.getTierManager().tiers.set(this.name.toLowerCase(), this);
            this.save();
            this.server.save();
            for (const attendance of this.server.getAttendanceManager().getAdvancedEvents().values()) {
                if (attendance.tier == this) {
                    attendance.embed.setFooter(this.name);
                    await attendance.message.edit(attendance.embed);
                }
            }
        }
    }

    /**
     * 
     * @param {string} id 
     * @param {Team} team 
     */
    async transferDriver(id, team) {
        const driver = this.getDriver(id);
        const reserve = this.getReserve(id);
        if (team) {
            if (driver) {
                if (team != driver.team) {
                    driver.team.removeDriver(id);
                    driver.setTeam(team);
                    team.setDriver(driver);
                }
            } else if (reserve) {
                team.setDriver(reserve);
                this.addDriver(reserve);
                this.removeReserve(reserve.id);
                reserve.toDriver(team);
                reserve.setTeam(team);
            } else {
                return;
            }
            this.server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                if (advanced.tier === this) {
                    await advanced.fix();
                }
            });
            await this.server.update();
        } else {
            if (driver) {
                driver.team.removeDriver(driver.id);
                this.addReserve(driver);
                this.removeDriver(driver.id);
                driver.toReserve();
                this.server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                    if (advanced.tier === this) {
                        await advanced.fix();
                    }
                });
                await this.server.update();
            }
        }
    }

    async loadJSON(object) {
        this.server = await this.client.manager.fetch(object.guild);
        if (this.server) {
            this.server.getTierManager().addTier(this);
            this.name = object.name;
            this.teams.clear();
            this.reserves.clear();

            for (const teamJSON of object.teams) {
                const team = new Team(this.client, this.server, teamJSON.name, this);
                this.addTeam(team);
                for (const driverJSON of teamJSON.drivers) {
                    try {
                        const member = await this.server.guild.members.fetch(driverJSON.id);
                        if (member) {
                            const driver = new Driver(this.client, member, this.server, team, driverJSON.number, this);
                            this.addDriver(driver);
                            team.setDriver(driver);
                            Logger.info(`[DRIVER] Loaded driver ${driver.name} from ${driver.guild.name} into tier ${driver.tier.name} with team ${driver.team.name}`);
                        }
                    } catch(err) {
                        Logger.warn(`[TIER] Missing driver ${driverJSON.id}`);
                    }
                };
            };

            for (const reserveJSON of object.reserves) {
                try {
                    const member = await this.server.guild.members.fetch(reserveJSON.id);
                    if (member) {
                        const reserve = new Reserve(this.client, member, this.server, reserveJSON.number, this);
                        this.addReserve(reserve);
                        Logger.info(`[DRIVER] Loaded reserve ${reserve.name} from ${reserve.guild.name} into tier ${reserve.tier.name}`);
                    }
                } catch(err) {
                    Logger.warn(`[TIER] Missing reserve ${reserveJSON.id}`);
                }
            }

            if (object.races) {
                for (const raceObject of object.races) {
                    const race = new Race(this);
                    race.load(this, raceObject);
                    this.races.push(race);
                    this.races.sort((a, b) => a.date.getTime() - b.date.getTime());
                }
            }
        }
    }

    toJSON() {
        const reservesArray = [];
        this.reserves.forEach(reserve => {
            reservesArray.push(reserve.toJSON());
        });
        const teamArray = [];
        this.teams.forEach(team => {
            teamArray.push(team.toJSON());
        });
        const racesArray = [];
        this.races.forEach(race => {
            racesArray.push(race.toJSON());
        });
        return {
            name: this.name,
            guild: this.server.id,
            reserves: reservesArray,
            teams: teamArray,
            races: racesArray,
        };
    }

    toString() {
        return this.name;
    }
}

module.exports = Tier;