const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'mark',
    aliases: ['check'],
    usage: '[ @driver ] [ in | out | maybe ] [ attendance-id ]',
    description: `Forcefully mark a driver's attendance`,
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
            if (message.mentions.members.size !== 1) {
                embed.setAuthor(`Please only mention 1 driver!`);
                message.channel.send(embed);
                return;
            }
            const member = message.mentions.members.first();
            const attendance = server.getAttendanceManager().fetchAdvanced(args[2]);
            if (attendance) {
                const driver = attendance.tier.getDriver(member.id);
                const reserve = attendance.tier.getReserve(member.id);
                if (driver) {
                    switch (args[1].toLowerCase()) {
                        case 'in':
                            attendance.accept(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as in!`);
                            break;
                        case 'out':
                            attendance.reject(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as out!`);
                            break;
                        case 'maybe':
                            attendance.maybe(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as maybe!`);
                            break;
                        default:
                            embed.setAuthor(`Unknown mark ${args[1]}! Use 'in' / 'out' / 'maybe'`);
                            break;
                    }
                    message.channel.send(embed);
                } else if (reserve) {
                    switch (args[1].toLowerCase()) {
                        case 'in':
                            attendance.accept(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as in!`);
                            break;
                        case 'out':
                            attendance.reject(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as out!`);
                            break;
                        case 'maybe':
                            attendance.maybe(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as maybe!`);
                            break;
                        default:
                            embed.setAuthor(`Unknown mark ${args[1]}! Use 'in' / 'out' / 'maybe'`);
                            break;
                    }
                    message.channel.send(embed);
                } else {
                    embed.setAuthor(`Unknown driver/reserve ${member.user.username}!`);
                    message.channel.send(embed);
                }
            } else {
                embed.setAuthor(`Unknown attendance of id ${args[2]}!`);
                message.channel.send(embed);
            }
        }
    }
};