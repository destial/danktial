const Discord = require('discord.js');
const AttendanceManager = require('../managers/AttendanceManager');
const Server = require('./Server');
const Tier = require('./Tier');

class AdvancedAttendance {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {Server} server
     * @param {Tier} tier
     * @param {Date} date
     * @param {AttendanceManager} attendanceManager 
     */
    constructor(client, message, server, tier, date, attendanceManager) {
        this.client = client;
        this.message = message;
        this.embed = message.embeds[0];
        this.server = server;
        this.id = message.id;
        this.date = new Date(date);
        this.attendanceManager = attendanceManager;
        this.tier = tier;
        this.drivers = tier.drivers;
    }
}

module.exports = AdvancedAttendance;