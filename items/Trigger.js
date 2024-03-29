const Database = require('../database/Database');

class Trigger {
    constructor(client, server, trigger, response) {
        this.client = client;
        this.server = server;
        this.trigger = trigger;
        this.response = response;
    }

    async save() {
       Database.run(Database.triggerSaveQuery, [this.server.id, this.trigger, this.response]);
       console.log(`[TRIGGERS] Saved trigger ${this.trigger} under ${this.server.guild.name}`);
    }

    async updateTrigger(oldTrigger) {
        Database.run(Database.triggerUpdateTriggerQuery, [this.trigger, this.server.id, oldTrigger, this.response]);
        console.log(`[TRIGGERS] Updated trigger ${oldTrigger} to ${this.trigger} under ${this.server.guild.name}`);
    }

    async updateResponse(oldResponse) {
        Database.run(Database.triggerUpdateResponseQuery, [this.response, this.server.id, this.trigger, oldResponse]);
        console.log(`[TRIGGERS] Updated response ${oldresponse} to ${this.response} under ${this.server.guild.name}`);
    }

    async delete() {
        Database.run(Database.triggerDeleteQuery, [this.server.id, this.trigger, this.response]);
        console.log(`[TRIGGERS] Deleted trigger ${this.trigger} with ${this.response}`);
    }

    toJSON() {
        return {
            guild: this.server.id,
            trigger: this.trigger,
            response: this.response
        };
    }
}

module.exports = Trigger;