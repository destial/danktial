const Database = require('../database/Database');
const { Logger } = require('../utils/Utils');

class Driver {
    constructor(client, member, server, team, number, tier) {
        this.client = client;
        this.member = member;
        this.id = member.id;
        this.server = server;
        this.guild = member.guild;
        this.team = team;
        this.number = number || '0';
        this.name = member.displayName;
        this.tier = tier;
    }

    async save() {
        Database.run(Database.driverSaveQuery, [this.id, this.guild.id, this.number, 0, (this.team ? this.team.name : ""), this.tier.name]);
        this.server.update();
        Logger.info(`[DRIVER] Saved driver ${this.name} from ${this.guild.name}`);
    }

    async update() {
        Database.run(Database.driverUpdateQuery, [(this.team ? 0 : 1), (this.team ? this.team.name : ""), this.id, this.guild.id, this.number, this.tier.name]);
        this.server.update();
        Logger.info(`[DRIVER] Updated ${this.team ? "driver" : "reserve"} ${this.name} from ${this.guild.name}`);
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[DRIVER] Updated ${this.team ? "driver" : "reserve"} ${this.name} from ${this.guild.name}`);
    }

    async updateReserve() {
        Database.run(Database.driverUpdateQuery, [1, "", this.id, this.guild.id, this.number, this.tier.name]);
        this.server.update();
        Logger.info(`[DRIVER] Updated reserve ${this.name} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {string} number 
     */
    async updateNum(number) {
        Database.run(Database.driverUpdateNumberQuery, [number, this.id, this.server.id]);
        this.setNumber(number);
        Logger.info(`[DRIVER] Updated driver number ${this.name} from ${this.guild.name}`);
    }

    async delete() {
        Database.run(Database.driversDeleteQuery, [this.id, this.guild.id, this.tier.name]);
        Logger.warn(`[DRIVER] Deleted driver ${this.name} from ${this.guild.name}`);
    }

    setTeam(team) {
        this.team = team;
    }

    setNumber(number) {
        this.number = number;
    }

    setTier(tier) {
        this.tier = tier;
    }

    toFullName() {
        return `#${this.number} - ${this.member}`;
    }

    async toReserve() {
        this.tier.removeDriver(this.id);
        this.team = undefined;
        this.updateReserve();
        return this;
    }

    async toDriver(team) {
        this.team = team;
        this.tier.removeReserve(this.id);
        this.tier.addDriver(this);
        team.setDriver(this);
        this.update();
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            guild: this.guild.id,
            number: this.number,
            name: this.member.displayName,
            team: (this.team ? this.team.name : null),
            tier: this.tier.name,
            reserved: false
        };
    }

    toString() {
        return `${this.member}`;
    }

    async DM(object) {
        return await this.member.user.send(object);
    }
}

module.exports = Driver;