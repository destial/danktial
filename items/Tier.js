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
     * @param {Driver} driver 
     */
    addDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
            driver.save();
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
        }
    }

    /**
     * 
     * @param {string} name 
     */
    removeTeam(name) {
        this.teams.delete(name.toLowerCase());
    }
}

module.exports = Tier;