const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'ticket',
    aliases: ['new', 'newticket'],
    usage: '[ add @user | < reason > | close ]',
    description: 'Opens a support ticket',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (server.enableTickets) {
            if (args.length) {
                switch (args[0].toLowerCase()) {
                    case "add": {
                        const ticket = server.getTicketManager().fetchTicket(message.channel.id);
                        if (!ticket) break;
                        if (!message.mentions.members.size) {
                            const embed = new Discord.MessageEmbed();
                            embed.setColor('RED');
                            embed.setAuthor('Please mention a user to add them to this ticket!');
                            embed.setDescription(`Usage: ${server.prefix}ticket add @user1 @user2`);
                            message.channel.send({ embeds: [embed] });
                            break;
                        }
                        for (const mention of message.mentions.members.values()) {
                            await ticket.addUser(mention);
                        }
                        break;
                    }
                    case "close": {
                        const ticket = server.getTicketManager().fetchTicket(message.channel.id);
                        if (!ticket) break;
                        ticket.awaitCloseC(message, message.member);
                        break;
                    }
                    default: {
                        server.getTicketManager().newTicket(message.member, args.join(' '), client.user);
                        break;
                    }
                }
                return;
            }
            server.getTicketManager().newTicket(message.member, args.join(' '), client.user);
        }
    }
};