const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'settings',
    aliases: ['stats'],
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
                .setAuthor(`Settings for ${server.guild.name}:`)
                .addFields([
                    { name: 'Prefix', value: server.prefix, inline: true },
                    { name: 'Mod-Log', value: (server.modlog ? server.modlog : "None"), inline: true },
                    { name: 'Total Tickets', value: server.getTicketManager().totaltickets, inline: true }
                ])
                .addFields([
                    { name: 'Open Tickets', value: server.getTicketManager().opentickets.size, inline: true },
                    { name: 'Active Events', value: server.getAttendanceManager().getEvents().size + server.getAttendanceManager().getAdvancedEvents().size, inline: true },
                    { name: 'Total tiers', value: server.getTierManager().tiers.size, inline: true }
                ]);
                var totalDrivers = 0; var totalReserves = 0; var totalTeams = 0;
                server.getTierManager().tiers.forEach(tier => {
                    totalDrivers += tier.drivers.size;
                    totalReserves += tier.reserves.size;
                    totalTeams += tier.teams.size;
                });
                embed.addFields([
                    { name: 'Total drivers', value: totalDrivers, inline: true },
                    { name: 'Total reserves', value: totalReserves, inline: true },
                    { name: 'Total teams', value: totalTeams, inline: true }
                ])
                var servers = 0;
                client.shard.fetchClientValues('guilds.cache.size').then(results => {
                    servers = results.reduce((acc, guildCount) => acc + guildCount, 0);
                });
                embed.setFooter(`Serving ${servers} guilds!`)
                .setColor('RED');

            await message.channel.send(embed);
        }
    }
};