const Discord = require('discord.js');
const Database = require('../database/Database');
const Reserve = require('./Reserve');
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
        console.log(`[DRIVER] Saved driver ${this.name} from ${this.guild.name}`);
    }

    async update() {
        await Database.run(Database.driverUpdateQuery, [0, (this.team ? this.team.name : ""), this.id, this.guild.id, this.number, this.tier.name]);
        console.log(`[DRIVER] Updated driver ${this.name} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {string} number 
     */
    async updateNumber(number) {
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
        return `${this.number} - ${this.member}`;
    }

    /**
     * @returns {Reserve}
     */
    async toReserve() {
        this.tier.removeDriver(this.id);
        const newReserve = new Reserve(this.client, this.member, this.server, this.number, this.tier);
        await newReserve.updateReserve();
        this.team = undefined;
        this.tier = undefined;
        return newReserve;
    }
}

module.exports = Driver;