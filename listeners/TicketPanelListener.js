const TicketManager = require('../managers/TicketManager');

module.exports = {
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;
            if (!reaction.message.guild || reaction.emoji.name !== TicketManager.emoji) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                if (server.enableTickets) {
                    const panel = server.getTicketManager().ticketpanels.get(reaction.message.id);
                    if (panel) {
                        const member = await server.guild.members.fetch(user.id);
                        if (member) {
                            server.getTicketManager().newTicket(member, undefined, client.user);
                            reaction.users.remove(user);
                        }
                    }
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (!message.author.bot) return;
            if (!message.guild) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                server.getTicketManager().removeTicketPanel(message.id);
            }
        });
    }
};