const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'advancedattendance',
    aliases: ['advancedevent', 'aatt'],
    usage: '',
    description: 'Creates a new advancedattendance',
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
            await server.getAttendanceManager().newAdvancedAttendance(client, server, message.member, message.channel);
        }
    }
};