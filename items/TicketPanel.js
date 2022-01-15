class TicketPanel {

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
            guild: this.channel.guild.id,
            channel: this.channel.id
        };
    }
}

module.exports = TicketPanel;