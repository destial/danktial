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
                message.channel.startTyping();
                if (!args.length) {
                    const embed = new Discord.MessageEmbed();
                    embed.setColor('RED');
                    embed.setAuthor(`Usage is:`);
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    await message.channel.send(embed);
                    message.channel.stopTyping(true);
                    return;
                }
                await server.getTicketManager().addTicketPanel(client, message.channel, args.join(' '));
                await message.delete({ timeout: 1000 });
                server.log(`${message.member.user.tag} has created a ticket panel in ${message.channel}`);
                message.channel.stopTyping(true);
            }
        }
    }
};