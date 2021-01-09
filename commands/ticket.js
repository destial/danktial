const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'ticket',
    aliases: ['new', 'newticket'],
    usage: '< reason >',
    description: 'Opens a support ticket',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        await server.getTicketManager().newTicket(message.member, args.join(' '), client.user);
    }
};