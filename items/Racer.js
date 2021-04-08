const { Client, User } = require("discord.js");
const Driver = require("./Driver");

class Racer {
    /**
     * 
     * @param {Client} client 
     * @param {User} user
     */
    constructor(client, user) {
        this.client = client;
        /**
         * @type {object[]}
         */
        this.leagues = [];
        this.user = user;
        this.id = user.id;
    }

    /**
     * 
     * @param {Driver} driver 
     */
    addLeague(driver) {
        const json = driver.toJSON();
        const index = this.leagues.findIndex(r => (r.guild === json.guild && r.tier === json.tier && r.team === json.team));
        if (index === -1) {
            this.leagues.push(json);
            console.log(`[RACER] Added tier ${json.tier} to ${json.name}`);
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    removeLeague(driver) {
        const json = driver.toJSON();
        const index = this.leagues.findIndex(r => (r.guild === json.guild && r.tier === json.tier && r.team === json.team));
        if (index !== -1) {
            this.leagues.splice(index, 1);
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removeServer(id) {
        const index = this.leagues.findIndex(r => (r.guild === id));
        if (index !== -1) {
            this.leagues.splice(index, 1);
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    transferTeam(driver) {
        const json = driver.toJSON();
        const existing = this.leagues.find(r => (r.guild === json.guild && r.tier === json.tier));
        if (existing) {
            existing.team = json.team;
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    changeNumber(driver) {
        const json = driver.toJSON();
        const existing = this.leagues.find(r => (r.id === driver.id && r.guild === json.guild && r.tier === json.tier));
        if (existing) {
            existing.number = json.number;
        }
    }

    toJSON() {
        return {
            id: this.user.id,
            leagues: this.leagues,
        }
    }
}

module.exports = Racer;