const Discord = require('discord.js');
const TicketManager = require("../managers/TicketManager");
const AttendanceManager = require("../managers/AttendanceManager");
const CountManager = require("../managers/CountManager");
const Database = require("../database/Database");
const ServerManager = require("../managers/ServerManager");

class Server {
    /**
     * @param {Discord.Client} client
     * @param {Discord.Guild} guild 
     * @param {Discord.TextChannel} modlog
     * @param {string} prefix
     * @param {number} tickets
     * @param {ServerManager} serverManager
     */
    constructor(client, guild, modlog, prefix, tickets, serverManager) {
        this.client = client;
        this.id = guild.id;
        this.guild = guild;
        this.modlog = modlog;
        this.prefix = prefix || "-";
        this.serverManager = serverManager;
        /**
         * @constant
         * @private
         */
        this.ticketManager = new TicketManager(client, this);

        this.ticketManager.totaltickets = tickets;

        /**
         * @constant
         * @private
         */
        this.attendanceManager = new AttendanceManager(client, this);

        /**
         * @constant
         * @private
         */
        this.countManager = new CountManager(this);
    }

    /**
     * 
     * @param {string} prefix 
     */
    async setPrefix(prefix) { 
        this.prefix = prefix;
        try {
            await this.save();
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 
     * @param {Discord.TextChannel} channel 
     */
    async setModLog(channel) {
        this.modlog = channel;
        try {
            await this.save();
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 
     * @param {string} title 
     * @param {string} description 
     */
    async log(title, description) {
        if (this.modlog) {
            try {
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`[LOG] ${title}`)
                    .setColor('ORANGE')
                    .setFooter(new Date().toString());
                if (description) 
                    embed.setDescription(description);

                await this.modlog.send(embed);
            } catch (err) {
                console.log(err);
            }
        }
    }

    async save() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        console.log(`[SERVER] Saved server ${this.id}`);
    }
    /**
     * @param {Discord.Guild} guild 
     * @param {Discord.TextChannel} modlog
     * @param {string} prefix
     * @param {number} tickets
     */
    load(guild, modlog, prefix, tickets) {
        this.guild = guild;
        this.id = guild.id;
        this.modlog = modlog;
        this.prefix = prefix;
        this.ticketManager.totaltickets = tickets;

        console.log(`[SERVER] Loaded server ${guild.id}`);
    }

    getTicketManager() { return this.ticketManager; }
    getAttendanceManager() { return this.attendanceManager; }
    getCountManager() { return this.countManager; }
}

module.exports = Server;