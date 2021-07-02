const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');
const parseQuotations = require('../utils/parseQuotations');

module.exports = {
    name: 'removeteam',
    aliases: ['delteam', 'deleteteam'],
    usage: '[ "team name" ] [ "tier name" ]',
    description: 'Deletes an existing team in a specific tier',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send(embed);
                return;
            }
            var str = args.join(' ');
            const arguments = parseQuotations(str);
            const tier = server.getTierManager().getTier(arguments[1]);
            if (!tier) {
                embed.setAuthor('Invalid tier name!');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                message.channel.send(embed);
                return;
            }
            const teamCol = tier.searchTeam(arguments[0]);
            if (teamCol.size > 1) {
                embed.setAuthor('Team name was found in many instances! Try to use the exact name!');
                var teamList = '';
                teamCol.forEach(team => {
                    teamList += `- ${team.name}\n`;
                });
                embed.setDescription(teamList);
                message.channel.send(embed);
                return;
            }
            const team = teamCol.first();
            if (!team) {
                embed.setAuthor('Invalid team name!');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                message.channel.send(embed);
                return;
            }
            team.delete();
            tier.removeTeam(team.name);
            team.tier = undefined;
            team.drivers.forEach(driver => {
                driver.setTeam(undefined);
                tier.removeDriver(driver.id);
                tier.addReserve(driver);
                driver.update();
            });
            server.getAttendanceManager().getAdvancedEvents().forEach(async event => {
                if (event.tier === tier) {
                    const teamField = event.embed.fields.find(f => f.name === team.name);
                    if (teamField) {
                        const index = event.embed.fields.indexOf(teamField);
                        event.embed.fields.splice(index, 1);
                    }
                    event.edit();
                }
            });
            embed.setAuthor(`Successfully removed team ${team.name} from tier ${tier.name}`);
            server.log(`${message.member.displayName} has removed team ${team.name} from tier ${tier.name}`);
            message.channel.send(embed);
        }
    }
};