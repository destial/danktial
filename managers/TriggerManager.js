const Discord = require('discord.js');
const Server = require('../items/Server');
const Trigger = require('../items/Trigger');

class TriggerManager {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     */
    constructor(client, server) {
        /**
         * @type {Discord.Collection<string, Trigger>}
         */
        this.triggers = new Discord.Collection();
        this.client = client;
        this.server = server;
    }

    /**
     * 
     * @param {Trigger} trigger 
     */
    addTrigger(trigger) {
        if (!this.triggers.get(trigger.trigger)) {
            this.triggers.set(trigger.trigger, trigger);
        }
    }

    /**
     * 
     * @param {string} triggerString
     */
    removeTrigger(triggerString) {
        this.triggers.delete(triggerString);
    }

    /**
     * 
     * @param {string} triggerString 
     */
    fetchTrigger(triggerString) {
        this.triggers.get(triggerString);
    }
}

module.exports = TriggerManager;