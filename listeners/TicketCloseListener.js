const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const TicketManager = require('../managers/TicketManager');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (reaction.partial) {
                try {
                    reaction = await reaction.fetch();
                } catch (err) {
                    console.log(`[TICKET] Something happened while trying to cache uncached message reactions!`);
                }
            }
            if (user.bot) return;
            if (!reaction.message.guild || reaction.emoji.name !== TicketManager.lock) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const ticket = server.getTicketManager().fetchTicket(reaction.message.channel.id);
                if (ticket) {
                    const member = server.guild.members.cache.get(user.id);
                    if (member) {
                        await ticket.awaitCloseR(reaction, member);
                    }
                }
            }
        });
    }

};