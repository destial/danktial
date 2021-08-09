const TicketManager = require('../managers/TicketManager');

module.exports = {
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;
            if (!reaction.message.guild || reaction.emoji.name !== TicketManager.lock) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const ticket = server.getTicketManager().fetchTicket(reaction.message.channel.id);
                if (ticket) {
                    const member = await server.guild.members.fetch(user.id);
                    if (member) {
                        ticket.awaitCloseR(reaction, member);
                    }
                }
            }
        });
    }

};