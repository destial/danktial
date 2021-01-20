const Discord = require('discord.js');
const ReactionRolePanel = require('../items/ReactionRolePanel');
const Server = require('../items/Server');

class ReactionRoleManager {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     */
    constructor(client, server) {
        this.client = client;
        this.server = server;
        /**
         * @type {Discord.Collection<string, ReactionRolePanel>}
         */
        this.panels = new Discord.Collection();
    }

    /**
     * 
     * @param {ReactionRolePanel} reactionRolePanel 
     */
    addPanel(reactionRolePanel) {
        if (this.panels.get(reactionRolePanel.message.id)) {
            this.panels.set(reactionRolePanel.message.id, reactionRolePanel);
        }
    }

    /**
     * 
     * @param {string} id 
     */
    removePanel(id) {
        this.panels.delete(id);
    }

    /**
     * 
     * @param {string} id 
     */
    fetch(id) {
        return this.panels.get(id);
    }
}
module.exports = ReactionRoleManager;