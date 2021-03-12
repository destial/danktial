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
        this.name = member.displayName;
        this.tier = tier;
        this.team = undefined;
    }

    async save() {
        await Database.run(Database.driverSaveQuery, [this.id, this.guild.id, this.number, 1, "", this.tier.name]);
        await this.server.update();
        console.log(`[DRIVER] Saved reserve ${this.name} from ${this.guild.name}`);
    }

    async updateReserve() {
        await Database.run(Database.driverUpdateQuery, [1, "", this.id, this.guild.id, this.number, this.tier.name]);
        await this.server.update();
        console.log(`[DRIVER] Updated reserve ${this.name} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {string} number 
     */
    async updateNumber(number) {
        await Database.run(Database.driverUpdateNumberQuery, [number, this.id, this.server.id]);
        this.setNumber(number);
        console.log(`[DRIVER] Updated reserve number ${this.name} from ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.driversDeleteQuery, [this.id, this.guild.id, this.tier.name]);
        console.log(`[DRIVER] Deleted reserve ${this.name} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {string} number 
     */
    setNumber(number) {
        this.number = number;
    }

    /**
     * 
     * @param {Tier} tier 
     */
    setTier(tier) {
        this.tier = tier;
    }

    toFullName() {
        return `#${this.number} - ${this.member}`;
    }

    /**
     * @param {Team} team
     * @returns {Driver}
     */
    async toDriver(team) {
        this.team = team;
        this.tier.removeReserve(this.id);
        this.tier.addDriver(this);
        team.setDriver(this);
        await this.update();
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            guild: this.guild.id,
            number: this.number,
            team: null,
            tier: this.tier.name,
            reserved: true
        };
    }

    toString() {
        return `${this.member}`;
    }

    async DM(object) {
        await this.member.user.send(object);
    }
}

module.exports = Reserve;