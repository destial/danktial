const Discord = require('discord.js');

class ReactionRolePanel {
    constructor(client, message, server) {
        this.client = client;
        this.server = server;
        this.message = message;
        this.reactions = new Discord.Collection();
    }

    addReactionRole(reactionRole) {
        if (!this.reactions.get(reactionRole.id)) {
            this.reactions.set(reactionRole.id, reactionRole);
        }
    }

    removeReactionRoleByEmoji(emojiid) {
        const keyArray = this.reactions.keyArray();
        const key = keyArray.find(k => k.includes(emojiid));
        if (key) {
            this.reactions.delete(key);
        }
    }

    removeReactionRoleByRole(roleid) {
        const id = this.reactions.findKey(rr => rr.role.id === roleid);
        if (id) {
            this.reactions.delete(id);
        }
    }

    getReactionRole(id) {
        return this.reactions.get(id);
    }
}

module.exports = ReactionRolePanel;