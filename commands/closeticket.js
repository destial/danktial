const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'closeticket',
    aliases: ['close'],
    usage: '',
    description: 'Closes a ticket',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        const ticket = server.getTicketManager().fetchTicket(message.channel.id);
        if (ticket) {
            ticket.awaitCloseC(message, message.member);
        }
    }
};