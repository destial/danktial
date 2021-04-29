const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');
const parseQuotations = require('../utils/parseQuotations');

module.exports = {
    name: 'transfer',
    aliases: ['drivertransfer'],
    usage: '[ @driver ] [ "teamname" | "Reserve" ] "tier-name"',
    description: 'Transfers a driver between teams in a tier',
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
            if (message.mentions.members.size === 0) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send(embed);
                return;
            }
            args.shift();
            const member = message.mentions.members.first();
            if (member) {
                var str = args.join(' ');
                const arguments = parseQuotations(str);
                if (arguments.length !== 2) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    message.channel.send(embed);
                    return;
                }
                const tier = server.getTierManager().getTier(arguments[1]);
                if (tier) {
                    const teamCol = tier.searchTeam(arguments[0]);
                    if (teamCol.size > 1) {
                        const embed5 = new Discord.MessageEmbed();
                        embed5.setColor('RED');
                        embed5.setAuthor('Team name was found in many instances! Try to use the exact name!');
                        var teamList = '';
                        teamCol.forEach(team => {
                            teamList += `- ${team.name}\n`;
                        });
                        embed5.setDescription(teamList);
                        message.channel.send(embed5);
                        return;
                    }
                    const team = teamCol.first();
                    const driver = tier.getDriver(member.id);
                    const reserve = tier.getReserve(member.id);
                    if (team) {
                        if (driver) {
                            driver.team.removeDriver(member.id);
                            driver.setTeam(team);
                            team.setDriver(driver);
                        } else if (reserve) {
                            team.setDriver(reserve);
                            tier.addDriver(reserve);
                            tier.removeReserve(reserve.id);
                            reserve.toDriver(team);
                        } else {
                            embed.setAuthor('Unknown driver / reserve! Usage is:');
                            embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                            message.channel.send(embed);
                            return;
                        }
                        embed.setAuthor(`Successfully set ${member.user.tag} as part of team ${team.name} in tier ${tier.name}`);
                        message.channel.send(embed);
                        await server.log(`${message.member.user.tag} has set ${member.user.tag} as part of ${team.name} in tier ${tier.name}`);
                        server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                            if (advanced.tier === tier) {
                                await advanced.fix();
                            }
                        });
                        await server.update();
                    } else if (arguments[0].toLowerCase().includes('reserve')) {
                        if (driver) {
                            driver.team.removeDriver(driver.id);
                            tier.addReserve(driver);
                            tier.removeDriver(driver.id);
                            driver.toReserve();
                        }
                        embed.setAuthor(`Successfully set ${member.user.tag} as a reserve in tier ${tier.name}`);
                        message.channel.send(embed);
                        await server.log(`${message.member.user.tag} has set ${member.user.tag} as a reserve in tier ${tier.name}`);
                        server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                            if (advanced.tier === tier) {
                                await advanced.fix();
                            }
                        });
                        await server.update();
                    } else {
                        embed.setAuthor('No team were matched! Usage is:');
                        embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                        message.channel.send(embed);
                        return;
                    }
                } else {
                    embed.setAuthor('Unknown tier! Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    message.channel.send(embed);
                    return;
                }
            } else {
                embed.setAuthor('Unknown member! Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                message.channel.send(embed);
                return;
            }
        }
    }
};