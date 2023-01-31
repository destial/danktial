const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'ticketpanel',
    aliases: ['tp'],
    usage: '[ title ]',
    description: 'Creates a ticket panel',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (server.enableTickets) {
            if (isStaff(message.member)) {
                if (!args.length) {
                    const embed = new Discord.MessageEmbed();
                    embed.setColor('RED');
                    embed.setAuthor(`Usage is:`);
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    embed.setFooter(this.description);
                    message.channel.send({ embeds: [embed] });
                    return;
                }
                server.getTicketManager().addTicketPanel(client, message.channel, args.join(' '));
                message.delete({ timeout: 1000 });
                server.log(`${message.member.user.tag} has created a ticket panel`, `Jump to ${message.channel}`);
            }
        }
    }
};