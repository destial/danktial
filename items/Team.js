const Discord = require('discord.js');
const Server = require("./Server");
const Driver = require('./Driver');
const Tier = require("./Tier");
const Database = require("../database/Database");

class Team {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} name 
     * @param {Tier} tier
     */
    constructor(client, server, name, tier) {
        this.client = client;
        this.server = server;
        /**
         * @type {Discord.Collection<string, Driver>}
         */
        this.drivers = new Discord.Collection();
        this.name = name;
        this.tier = tier;
    }

    /**
     * 
     * @param {Driver} driver 
     */
    setDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
            driver.setTeam(this);
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
     * @param {string} id 
     */
    getDriver(id) {
        this.drivers.get(id);
    }

    async save() {
        await Database.run(Database.teamSaveQuery, [this.server.id, this.name, this.tier.name]);
        await this.server.update();
        console.log(`[TEAM] Saved team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async delete() {
        await Database.run(Database.teamDeleteQuery, [this.server.id, this.name, this.tier.name]);
        await this.server.update();
        console.log(`[TEAM] Deleted team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async update() {
        await Database.run(Database.teamUpdateQuery, [this.server.id, this.name, this.tier.name, this.server.id, this.name, this.tier.name]);
        await this.server.update();
        console.log(`[TEAM] Updated team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    /**
     * 
     * @param {string} oldName 
     */
    async updateName(oldName) {
        await Database.run(Database.teamUpdateNameQuery, [this.name, this.server.id, oldName, this.tier.name]);
        console.log(`[TEAM] Updated team name ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async loadJSON(object) {
        this.server = await this.client.manager.fetch(object.guild);
        if (this.server) {
            this.name = object.name;
            this.tier = this.server.getTierManager().getTier(object.tier);
            if (this.tier) {
                object.drivers.forEach(id => {
                    const driver = this.tier.getDriver(id);
                    if (driver) {
                        this.drivers.set(driver.id, driver);
                    }
                });
            }
        }
    }

    toJSON() {
        const driverArray = [];
        this.drivers.forEach(driver => {
            driverArray.push(driver.toJSON());
        }); 
        return {
            name: this.name,
            guild: this.server.id,
            drivers: driverArray,
            tier: this.tier.name,
        };
    }

    toString() {
        return this.name;
    }
}

module.exports = Team;