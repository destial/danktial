const { DiscordAPIError } = require("discord.js");

const Discord = require('discord.js');
const Server = require("./Server");
const Driver = require('./Driver');
const Tier = require("./Tier");

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
}

module.exports = Team;