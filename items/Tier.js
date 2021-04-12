const Discord = require('discord.js');
const Database = require('../database/Database');
const Query = require('../database/Query');
const Driver = require('./Driver');
const Racer = require('./Racer');
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
         * @type {Discord.Collection<string, Driver>}
         */
        this.drivers = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, Reserve>}
         */
        this.reserves = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, Team>}
         */
        this.teams = new Discord.Collection();

        this.name = name;
        console.log(`[TIER] Added tier ${this.name} from ${this.server.guild.name}`);
    }

    async save() {
        await Database.run(Database.tierSaveQuery, [this.server.id, this.name]);
        console.log(`[TIER] Saved tier ${this.name} from ${this.server.guild.name}`);
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
        console.log(`[TIER] Updated tier ${this.name} from ${this.server.guild.name}`);
    }

    async delete() {
        await Database.run(Database.tierDeleteQuery, [this.server.id, this.name]);
        console.log(`[TIER] Deleted tier ${this.name} from ${this.server.guild.name}`);
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
                deleteDrivers.then(() => {
                    this.drivers.clear();
                });
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
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
            // const racer = this.server.serverManager.racers.get(driver.id);
            // if (racer) {
            //     racer.addLeague(driver);
            // } else {
            //     const r = new Racer(this.client, driver.member.user);
            //     r.addLeague(driver);
            //     this.server.serverManager.racers.set(racer.id, racer);
            // }
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    loadDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
            // const racer = this.server.serverManager.racers.get(driver.id);
            // if (racer) {
            //     racer.addLeague(driver);
            // } else {
            //     const r = new Racer(this.client, driver.member.user);
            //     r.addLeague(driver);
            //     this.server.serverManager.racers.set(racer.id, racer);
            // }
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removeDriver(id) {
        const driver = this.drivers.get(id);
        // const racer = this.server.serverManager.racers.get(id);
        // if (racer && driver) {
        //     racer.removeLeague(driver);
        // }
        this.drivers.delete(id);
    }

    /**
     * 
     * @param {Reserve | Driver} reserve 
     */
    addReserve(reserve) {
        if (!this.reserves.get(reserve.id)) {
            this.reserves.set(reserve.id, reserve);
            // const racer = this.server.serverManager.racers.get(reserve.id);
            // if (racer) {
            //     racer.addLeague(reserve);
            // } else {
            //     const r = new Racer(this.client, reserve.member.user);
            //     r.addLeague(reserve);
            // }
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removeReserve(id) {
        const driver = this.reserves.get(id);
        const racer = this.server.serverManager.racers.get(id);
        // if (racer && driver) {
        //     racer.removeLeague(driver);
        // }
        this.reserves.delete(id);
    }

    /**
     * 
     * @param {Team} team 
     */
    addTeam(team) {
        if (!this.teams.get(team.name.toLowerCase())) {
            this.teams.set(team.name.toLowerCase(), team);
            console.log(`[TEAM] Added team ${team.name} from ${this.server.guild.name} to ${this.name}`);
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
        return this.drivers.get(id);
    }

    /**
     * 
     * @param {string} id 
     */
    getReserve(id) {
        return this.reserves.get(id);
    }

    setName(newName) {
        if (newName) {
            this.server.getTierManager().tiers.delete(this.name.toLowerCase());
            this.name = newName;
            this.server.getTierManager().tiers.set(this.name.toLowerCase(), this);
            this.save();
            this.server.save();

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
                    const racer = this.server.serverManager.racers.get(id);
                    if (racer) {
                        racer.transferTeam(driver);
                    }
                }
            } else if (reserve) {
                team.setDriver(reserve);
                this.addDriver(reserve);
                this.removeReserve(reserve.id);
                reserve.toDriver(team);
                reserve.setTeam(team);
                // const racer = this.server.serverManager.racers.get(id);
                // if (racer) {
                //     racer.transferTeam(reserve);
                // }
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
                // const racer = this.server.serverManager.racers.get(id);
                // if (racer) {
                //     racer.transferTeam(driver);
                // }
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
            this.name = object.name;
            this.teams.clear();
            this.drivers.clear();
            this.reserves.clear();

            object.teams.forEach(teamJSON => {
                const team = new Team(this.client, this.server, teamJSON.name, this);
                this.addTeam(team);
                teamJSON.drivers.forEach(async driverJSON => {
                    try {
                        const member = await this.server.guild.members.fetch(driverJSON.id);
                        if (member) {
                            const driver = new Driver(this.client, member, this.server, team, driverJSON.number, this);
                            this.addDriver(driver);
                            team.setDriver(driver);
                            console.log(`[DRIVER] Loaded driver ${driver.name} from ${driver.guild.name} into tier ${driver.tier.name} with team ${driver.team.name}`);
                        }
                    } catch(err) {
                        console.log(`[TIER] Missing driver ${driverJSON.id}`);
                    }
                });
            });
            this.server.getTierManager().addTier(this);

            object.reserves.forEach(async reserveJSON => {
                try {
                    const member = await this.server.guild.members.fetch(reserveJSON.id);
                    if (member) {
                        const reserve = new Reserve(this.client, member, this.server, reserveJSON.number, this);
                        this.addReserve(reserve);
                        console.log(`[DRIVER] Loaded reserve ${reserve.name} from ${reserve.guild.name} into tier ${reserve.tier.name}`);
                    }
                } catch(err) {
                    console.log(`[TIER] Missing reserve ${reserveJSON.id}`);
                }
            });
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
        return {
            name: this.name,
            guild: this.server.id,
            reserves: reservesArray,
            teams: teamArray,
        };
    }

    toString() {
        return this.name;
    }
}

module.exports = Tier;