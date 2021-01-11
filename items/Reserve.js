const Discord = require('discord.js');
const Database = require('../database/Database');
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

    async save() {
        await Database.run(Database.driverSaveQuery, [this.id, this.guild.id, this.number, 1, (this.team ? this.team.name : ""), this.tier.name]);
        console.log(`[DRIVER] Saved reserve ${this.name} from ${this.guild.name}`);
    }
}

module.exports = Reserve;