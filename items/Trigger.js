const Discord = require('discord.js');
const Server = require('./Server');

class Trigger {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} trigger 
     * @param {string} response 
     */
    constructor(client, server, trigger, response) {
        this.client = client;
        this.server = server;
        this.trigger = trigger;
        this.response = response;
    }
}

module.exports = Trigger;