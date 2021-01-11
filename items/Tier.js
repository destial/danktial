const Discord = require('discord.js');
const Database = require('../database/Database');
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

    /**
     * 
     * @param {Driver} driver 
     */
    addDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
        }
    }

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
     * @param {Reserve} reserve 
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
            console.log(`[TEAM] Added team ${team.name} to ${this.name}`);
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
}

module.exports = Tier;