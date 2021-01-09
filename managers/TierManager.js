const Discord = require('discord.js');
const Server = require('../items/Server');
const Tier = require('../items/Tier');

class TierManager {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     */
    constructor(client, server) {
        this.client = client;
        this.server = server;
        /**
         * @type {Discord.Collection<string, Tier>}
         */
        this.tiers = new Discord.Collection();
    }

    /**
     * 
     * @param {Tier} tier 
     */
    addTier(tier) {
        if (!this.tiers.get(tier.name.toLowerCase())) {
            this.tiers.set(tier.name.toLowerCase(), tier);
        }
    }

    /**
     * 
     * @param {string} name 
     */
    removeTier(name) {
        this.tiers.delete(name.toLowerCase());
    }

    /**
     * 
     * @param {string} name
     */
    getTier(name) {
        return this.tiers.get(name.toLowerCase());
    }
}

module.exports = TierManager;