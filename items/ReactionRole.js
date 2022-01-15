const Database = require('../database/Database');

class ReactionRole {
    constructor(client, server, message, emoji, role) {
        this.client = client;
        this.emoji = emoji;
        this.role = role;
        this.message = message;
        this.server = server;
        this.id = this.message.id + this.emoji.id;
    }

    async save() {
        Database.run(Database.reactionRoleSaveQuery, this.server.id, this.message.id, this.emoji.id, this.role.id);
        console.log(`[REACTIONROLE] Saved reactionrole ${this.emoji.name} with ${this.role.name}`);
    }

    async updateEmoji(oldID) {
        Database.run(Database.reactionRoleUpdateEmojiQuery, [this.emoji.id, this.server.id, this.message.id, oldID, this.role.id]);
        console.log(`[REACTIONROLE] Updated reactionrole ${this.emoji.name} with ${this.role.name}`); 
    }

    async updateRole(oldID) {
        Database.run(Database.reactionRoleUpdateRoleQuery, [this.role.id, this.server.id, this.message.id, this.emoji.id, oldID]);
        console.log(`[REACTIONROLE] Updated reactionrole ${this.emoji.name} with ${this.role.name}`); 
    }

    async delete() {
        Database.run(Database.reactionRoleDeleteQuery, [this.server.id, this.message.id, this.emoji.id, this.role.id]);
        console.log(`[REACTIONROLE] Deleted reactionrole ${this.emoji.name} with ${this.role.name}`);
    }

    toJSON() {
        return {
            id: this.id,
            role: this.role.id,
            emoji: this.emoji.id,
            guild: this.server.id,
            panel: this.message.id,
        };
    }
}

module.exports = ReactionRole;