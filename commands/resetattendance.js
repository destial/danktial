const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'resetattendance',
    aliases: ['fixattendance'],
    usage: '[ id ]',
    description: 'Resets an advancedattendance to all drivers having an unknown mark',
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
            if (command === this.name) {
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    embed.setFooter(this.description);
                    message.channel.send(embed);
                    return;
                }
                const attendance = server.getAttendanceManager().fetchAdvanced(args[0]);
                if (attendance) {
                    await attendance.reset();
                    embed.setAuthor(`Attendance ${attendance.embed.title} has been reset!`);
                    message.channel.send(embed);
                    await server.log(`${message.member.user.tag} has reset attendance ${attendance.embed.title}`);
                } else {
                    embed.setAuthor('Attendance does not exist! Perhaps using the wrong message id?');
                    embed.setDescription('If you are in developer mode, right click the attendance and copy the id to get the message id');
                    message.channel.send(embed);
                }
            } else if (command === this.aliases[0]) {
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    embed.setFooter(this.description);
                    message.channel.send(embed);
                    return;
                }
                const attendance = server.getAttendanceManager().fetchAdvanced(args[0]);
                if (attendance) {
                    await attendance.fix();
                    embed.setAuthor(`Attendance ${attendance.embed.title} has been fixed and updated!`);
                    message.channel.send(embed);
                    await server.log(`${message.member.user.tag} has fixed attendance ${attendance.embed.title}`);
                } else {
                    embed.setAuthor('Attendance does not exist! Perhaps using the wrong message id?');
                    embed.setDescription('If you are in developer mode, right click the attendance and copy the id to get the message id');
                    message.channel.send(embed);
                }
            }
        }
    }
};