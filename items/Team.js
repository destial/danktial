const { Collection } = require('discord.js');
const Database = require("../database/Database");

class Team {
    constructor(client, server, name, tier) {
        this.client = client;
        this.server = server;
        this.drivers = new Collection();
        this.name = name;
        this.tier = tier;
        this.logo = undefined;
    }

    setDriver(driver) {
        if (!this.drivers.get(driver.id)) {
            this.drivers.set(driver.id, driver);
            driver.setTeam(this);
        }
    }

    removeDriver(id) {
        this.drivers.delete(id);
    }

    getDriver(id) {
        this.drivers.get(id);
    }

    async save() {
        Database.run(Database.teamSaveQuery, [this.server.id, this.name, this.tier.name]);
        this.server.update();
        this.client.manager.debug(`[TEAM] Saved team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async delete() {
        Database.run(Database.teamDeleteQuery, [this.server.id, this.name, this.tier.name]);
        this.server.update();
        this.client.manager.debug(`[TEAM] Deleted team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async update() {
        Database.run(Database.teamUpdateQuery, [this.server.id, this.name, this.tier.name, this.server.id, this.name, this.tier.name]);
        this.server.update();
        this.client.manager.debug(`[TEAM] Updated team ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async updateName(oldName) {
        Database.run(Database.teamUpdateNameQuery, [this.name, this.server.id, oldName, this.tier.name]);
        this.server.update();
        this.client.manager.debug(`[TEAM] Updated team name ${this.name} from ${this.server.guild.name} in ${this.tier.name}`);
    }

    async setName(newName) {
        if (newName) {
            const oldName = this.name;
            this.tier.teams.delete(this.name.toLowerCase());
            this.name = newName;
            this.tier.teams.set(this.name.toLowerCase(), this);
            this.save();
            this.server.save();
            for (const attendance of this.server.getAttendanceManager().getAdvancedEvents().values()) {
                if (attendance.tier == this.tier) {
                    attendance.fixTeams(oldName, this.name);
                }
            }
            for (const race of this.tier.races) {
                for (const result of race.results) {
                    if (result.driver.team.name === oldName) {
                        result.driver.team.name = this.name;
                    }
                }
                for (const result of race.qualifying) {
                    if (result.driver.team.name === oldName) {
                        result.driver.team.name = this.name;
                    } 
                }
            }
        }
    }

    async loadJSON(tier, object) {
        this.server = await this.client.manager.fetch(object.guild);
        if (this.server) {
            this.name = object.name;
            this.tier = tier;
            if (this.tier) {
                for (const id of object.drivers) {
                    const driver = this.tier.getDriver(id);
                    if (driver) {
                        this.drivers.set(driver.id, driver);
                    }
                }
            }
        }
    }

    toJSON() {
        const driverArray = [];
        this.drivers.forEach(driver => {
            driverArray.push(driver.toJSON());
        }); 
        return {
            name: this.name,
            guild: this.server.id,
            drivers: driverArray,
            tier: this.tier.name,
        };
    }

    toString() {
        return this.name;
    }
}

module.exports = Team;