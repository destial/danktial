const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'mark',
    aliases: ['check'],
    usage: '[ @driver ] [ "in" | "out" | "maybe" ] [ attendance-id ]',
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
            message.channel.startTyping();
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                await message.channel.send(embed);
                message.channel.stopTyping(true);
                return;
            }
            if (message.mentions.members.size !== 1) {
                embed.setAuthor(`Please only mention 1 driver!`);
                await message.channel.send(embed);
                message.channel.stopTyping(true);
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
                            await attendance.accept(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as in!`);
                            break;
                        case 'out':
                            await attendance.reject(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as out!`);
                            break;
                        case 'maybe':
                            await attendance.maybe(driver);
                            embed.setAuthor(`Marked ${driver.member.user.username} as maybe!`);
                            break;
                        default:
                            embed.setAuthor(`Unknown mark ${args[1]}! Use 'in' / 'out' / 'maybe'`);
                            break;
                    }
                    await message.channel.send(embed);
                } else if (reserve) {
                    switch (args[1].toLowerCase()) {
                        case 'in':
                            await attendance.accept(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as in!`);
                            break;
                        case 'out':
                            await attendance.reject(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as out!`);
                            break;
                        case 'maybe':
                            await attendance.maybe(reserve);
                            embed.setAuthor(`Marked ${reserve.member.user.username} as maybe!`);
                            break;
                        default:
                            embed.setAuthor(`Unknown mark ${args[1]}! Use 'in' / 'out' / 'maybe'`);
                            break;
                    }
                    await message.channel.send(embed);
                } else {
                    embed.setAuthor(`Unknown driver/reserve ${member.user.username}!`);
                    await message.channel.send(embed);
                }
            } else {
                embed.setAuthor(`Unknown attendance of id ${args[2]}!`);
                await message.channel.send(embed);
            }
            message.channel.stopTyping(true);
        }
    }
};