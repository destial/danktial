const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('./Server');

class Trigger {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} trigger 
     * @param {string} response 
     */
    constructor(client, server, trigger, response) {
        this.client = client;
        this.server = server;
        this.trigger = trigger;
        this.response = response;
    }

    async save() {
       await Database.run(Database.triggerSaveQuery, [this.server.id, this.trigger, this.response]);
       console.log(`[TRIGGERS] Saved trigger ${this.trigger} under ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {string} oldTrigger 
     */
    async updateTrigger(oldTrigger) {
        await Database.run(Database.triggerUpdateTriggerQuery, [this.trigger, this.server.id, oldTrigger, this.response]);
        console.log(`[TRIGGERS] Updated trigger ${oldTrigger} to ${this.trigger} under ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {string} oldResponse
     */
    async updateResponse(oldResponse) {
        await Database.run(Database.triggerUpdateResponseQuery, [this.response, this.server.id, this.trigger, oldResponse]);
        console.log(`[TRIGGERS] Updated response ${oldresponse} to ${this.response} under ${this.server.guild.name}`);
    }

    async delete() {
        await Database.run(Database.triggerDeleteQuery, [this.server.id, this.trigger, this.response]);
        console.log(`[TRIGGERS] Deleted trigger ${this.trigger} with ${this.response}`);
    }
}

module.exports = Trigger;