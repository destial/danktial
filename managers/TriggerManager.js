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
        return this.triggers.get(triggerString);
    }

    /**
     * 
     * @param {string} triggerString 
     */
    searchTrigger(triggerString) {
        return this.triggers.find(t => triggerString.includes(t.trigger));
    }

    /**
     * 
     * @param {string} triggerString 
     */
    getTrigger(triggerString) {
        const trigger = this.triggers.find(t => triggerString.toLowerCase().includes(t.trigger.toLowerCase()));
        if (trigger) {
            if (trigger.trigger.startsWith('!')) {
                return trigger;
            } else {
                if (triggerString == trigger.trigger) {
                    return trigger;
                }
            }
        }
        return undefined;
    }
}

module.exports = TriggerManager;