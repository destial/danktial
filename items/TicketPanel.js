const TicketManager = require('../managers/TicketManager');
const Discord = require('discord.js');

class TicketPanel {
    /**
     * @param {Discord.Client} client
     * @param {TicketManager} ticketManager
     * @param {string} id
     * @param {Discord.MessageEmbed} embed 
     * @param {Discord.TextChannel} channel
     */
    constructor(client, ticketManager, id, embed, channel) {
        this.client = client;
        this.ticketManager = ticketManager;
        this.id = id;
        this.panel = embed;
        this.channel = channel;
    }

    toJSON() {
        return {
            id: this.id,
            channel: this.channel.id
        };
    }
}

module.exports = TicketPanel;