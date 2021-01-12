const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'resetattendance',
    usage: '[ id ]',
    description: 'Resets a advancedattendance to all drivers having an unknown mark',
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
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${this.name} ${this.usage}`);
                message.channel.send(embed);
                return;
            }
            const attendance = server.getAttendanceManager().fetchAdvanced(args[0]);
            if (attendance) {
                await attendance.reset();
                embed.setAuthor(`Attendance ${attendance.embed.title} has been reset!`);
                message.channel.send(embed);
                server.log(`${message.member.user.tag} has reset attendance ${attendance.embed.title}`);
            } else {
                embed.setAuthor('Attendance does not exist! Perhaps using the wrong message id?');
                embed.setDescription('If you are in developer mode, right click the attendance and copy the id to get the message id');
                message.channel.send(embed);
            }
        }
    }
};