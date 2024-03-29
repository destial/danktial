const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'stats',
    usage: '',
    description: 'Displays the server settings and bot stats',
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
                .setTitle(`Statistics for ${server.guild.name}:`)
                .addFields([
                    { name: 'Prefix', value: server.prefix, inline: true },
                    { name: 'Mod-Log', value: (server.modlog ? server.modlog : "None"), inline: true },
                    { name: 'Total Tickets', value: server.getTicketManager().totaltickets, inline: true }
                ])
                .addFields([
                    { name: 'Open Tickets', value: server.getTicketManager().opentickets.size, inline: true },
                    { name: 'Active Events', value: server.getAttendanceManager().getEvents().size + server.getAttendanceManager().getAdvancedEvents().size, inline: true },
                    { name: 'Total Tiers', value: server.getTierManager().tiers.size, inline: true }
                ]);
            var totalDrivers = 0; var totalReserves = 0; var totalTeams = 0;
            server.getTierManager().tiers.forEach(tier => {
                tier.teams.forEach(t => {
                    totalDrivers += t.drivers.size;
                });
                totalReserves += tier.reserves.size;
                totalTeams += tier.teams.size;
            });
            embed.addFields([
                { name: 'Total Drivers', value: totalDrivers, inline: true },
                { name: 'Total Reserves', value: totalReserves, inline: true },
                { name: 'Total Teams', value: totalTeams, inline: true }
            ]);
            const servers = client.manager.servers.size;
                embed.setFooter(`Competing in ${servers} leagues! • https://www.destial.xyz • Built by destiall#9640`)
                .setColor('RED');
            message.channel.send(embed);
        }
    }
};