const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'attendance',
    aliases: ['event', 'att'],
    usage: '',
    description: 'Creates a new attendance',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            await message.delete({ timeout: 1000 });
            const attendance = await server.getAttendanceManager().newAttendance(message.member, message.channel);
            if (attendance) {
                server.log(`${message.member.user.tag} has created attendance ${attendance.title}`);
            }
            message.channel.stopTyping(true);
        }
    }
};