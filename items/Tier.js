const Discord = require('discord.js');
const Database = require('../database/Database');
const Query = require('../database/Query');
const Driver = require('./Driver');
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
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    loadDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removeDriver(id) {
        this.drivers.delete(id);
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
                        }
                    } catch(err) {
                        console.log(`[TIER] Missing driver ${driverJSON.id}`);
                    }
                });
            });

            object.reserves.forEach(async reserveJSON => {
                try {
                    const member = await this.server.guild.members.fetch(reserveJSON.id);
                    if (member) {
                        const reserve = new Reserve(this.client, member, this.server, reserveJSON.number, this);
                        this.addReserve(reserve);
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