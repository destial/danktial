const Discord = require('discord.js');
const Driver = require('./Driver');
const Server = require('./Server');
const Tier = require('./Tier');

class Reserve extends Driver {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.GuildMember} member 
     * @param {Server} server
     * @param {string} number 
     * @param {Tier} tier
     */
    constructor(client, member, server, number, tier) {
        super(client, member, server, undefined, number, tier);
    }
}

module.exports = Reserve;