const Discord = require('discord.js');
const Server = require('../items/Server');
const Trigger = require('../items/Trigger');
const ServerManager = require('./ServerManager');

class TriggerManager {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     */
    constructor(client, server) {
        /**
         * @type {Discord.Collection<string, Trigger>}
         */
        this.triggers = new Discord.Collection();
    }
}

module.exports = TriggerManager;