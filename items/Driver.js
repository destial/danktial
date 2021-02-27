const Discord = require('discord.js');
const Database = require('../database/Database');
//const Reserve = require('./Reserve');
const Server = require('./Server');
const Team = require('./Team');
const Tier = require('./Tier');

class Driver {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.GuildMember} member 
     * @param {Server} server
     * @param {Team} team
     * @param {string} number
     * @param {Tier} tier
     */
    constructor(client, member, server, team, number, tier) {
        this.client = client;
        this.member = member;
        this.id = member.id;
        this.server = server;
        this.guild = member.guild;
        this.team = team;
        this.number = number || 0;
        this.name = member.user.username;
        this.tier = tier;
    }

    async save() {
        await Database.run(Database.driverSaveQuery, [this.id, this.guild.id, this.number, 0, (this.team ? this.team.name : ""), this.tier.name]);
        await this.server.update();
        console.log(`[DRIVER] Saved driver ${this.name} from ${this.guild.name}`);
    }

    async update() {
        await Database.run(Database.driverUpdateQuery, [(this.team ? 0 : 1), (this.team ? this.team.name : ""), this.id, this.guild.id, this.number, this.tier.name]);
        await this.server.update();
        console.log(`[DRIVER] Updated ${this.team ? "driver" : "reserve"} ${this.name} from ${this.guild.name}`);
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
    async updateNum(number) {
        await Database.run(Database.driverUpdateNumberQuery, [number, this.id, this.server.id]);
        this.setNumber(number);
        console.log(`[DRIVER] Updated driver number ${this.name} from ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.driversDeleteQuery, [this.id, this.guild.id, this.tier.name]);
        console.log(`[DRIVER] Deleted driver ${this.name} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {Team} team 
     */
    setTeam(team) {
        this.team = team;
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
     * @returns {Driver}
     */
    async toReserve() {
        this.tier.removeDriver(this.id);
        this.team = undefined;
        await this.updateReserve();
        return this;
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
            team: this.team.name,
            tier: this.tier.name,
            reserved: false
        };
    }

    toString() {
        return `${this.member}`;
    }

    async DM(object) {
        await this.member.user.send(object);
    }
}

module.exports = Driver;