const Discord = require('discord.js');
const ReactionRole = require('./ReactionRole');
const Server = require('./Server');

class ReactionRolePanel {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Message} message
     * @param {Server} server 
     */
    constructor(client, message, server) {
        this.client = client;
        this.server = server;
        this.message = message;
        /**
         * @type {Discord.Collection<string, ReactionRole>}
         */
        this.reactions = new Discord.Collection();
    }

    /**
     * 
     * @param {ReactionRole} reactionRole 
     */
    addReactionRole(reactionRole) {
        if (!this.reactions.get(reactionRole.id)) {
            this.reactions.set(reactionRole.id, reactionRole);
        }
    }

    /**
     * 
     * @param {string} emojiid 
     */
    removeReactionRoleByEmoji(emojiid) {
        this.reactions.delete(emojiid);
    }

    /**
     * 
     * @param {string} roleid 
     */
    removeReactionRoleByRole(roleid) {
        const id = this.reactions.findKey(rr => rr.role.id === roleid);
        if (id) {
            this.reactions.delete(id);
        }
    }

    /**
     * 
     * @param {string} id 
     */
    getReactionRole(id) {
        return this.reactions.get(id);
    }
}

module.exports = ReactionRolePanel;