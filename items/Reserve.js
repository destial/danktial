const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('./Driver');
const Server = require('./Server');
const Team = require('./Team');
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
        this.client = client;
        this.member = member;
        this.server = server;
        this.number = number;
        this.tier = tier;
        this.team = undefined;
    }

    async save() {
        await Database.run(Database.driverSaveQuery, [this.id, this.guild.id, this.number, 1, (this.team ? this.team.name : ""), this.tier.name]);
        console.log(`[DRIVER] Saved reserve ${this.name} from ${this.guild.name}`);
    }

    async updateReserve() {
        await Database.run(Database.driverUpdateQuery, [1, "", this.id, this.guild.id, this.number, this.tier.name]);
        console.log(`[DRIVER] Updated reserve ${this.name} from ${this.guild.name}`);
    }

    /**
     * @param {Team} team
     * @returns {Driver}
     */
    async toDriver(team) {
        this.tier.removeReserve(this.id);
        const newDriver = new Driver(this.client, this.member, this.server, team, this.number, this.tier);
        await newDriver.update();
        this.tier = undefined;
        return newDriver;
    }
}

module.exports = Reserve;