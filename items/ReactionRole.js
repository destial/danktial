const Discord = require('discord.js');
const Server = require('./Server');

class ReactionRole {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server
     * @param {Discord.Message} message
     * @param {Discord.ReactionEmoji} emoji 
     * @param {Discord.Role} role 
     */
    constructor(client, server, message, emoji, role) {
        this.client = client;
        this.emoji = emoji;
        this.role = role;
        this.message = message;
        this.server = server;
        this.id = this.emoji.id;
    }
}

module.exports = ReactionRole;