const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'settings',
    aliases: ['stats'],
    usage: '',
    description: 'Displays the server settings',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            const embed = new Discord.MessageEmbed()
                .setAuthor(`Settings for ${server.guild.name}:`)
                .addFields([
                    { name: 'Prefix', value: server.prefix, inline: true },
                    { name: 'Mod-Log', value: (server.modlog ? server.modlog : "None"), inline: true },
                    { name: 'Total Tickets', value: server.getTicketManager().totaltickets, inline: true }
                ])
                .addFields([
                    { name: 'Open Tickets', value: server.getTicketManager().opentickets.size, inline: true },
                    { name: 'Active Events', value: server.getAttendanceManager().getEvents().size, inline: true }
                ])
                .setColor('RED');

            await message.channel.send(embed);
        }
    }
};