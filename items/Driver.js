const Discord = require('discord.js');
const Database = require('../database/Database');
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
}

module.exports = Driver;