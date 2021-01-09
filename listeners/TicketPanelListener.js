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
                    console.log('[ERROR] Something happened while fetching uncached message reactions!', err);
                }
            }
            if (user.bot) return;
            if (!reaction.message.guild || reaction.emoji.name !== TicketManager.emoji) return;
            const server = await servers.fetch(reaction.message.guild.id);
            const panel = server.getTicketManager().ticketpanels.get(reaction.message.id);
            if (panel) {
                const member = await reaction.message.guild.members.fetch(user.id);
                if (member) {
                    await server.getTicketManager().newTicket(member, undefined, client.user);
                }
            }
            await reaction.users.remove(user);
        });

        client.on('messageDelete', async message => {
            if (message.partial) {
                try {
                    message = await message.fetch();
                } catch (err) {
                    console.log('[ERROR] Something happened while fetching uncached deleted messages!', err);
                }
            }
            const server = await servers.fetch(message.guild.id);
            await server.getTicketManager().removeTicketPanel(message.id);
        });
    }
};