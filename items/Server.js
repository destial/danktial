const Discord = require('discord.js');
const TicketManager = require("../managers/TicketManager");
const AttendanceManager = require("../managers/AttendanceManager");
const CountManager = require("../managers/CountManager");
const Database = require("../database/Database");
const ServerManager = require("../managers/ServerManager");
const TierManager = require('../managers/TierManager');
const TriggerManager = require('../managers/TriggerManager');
const ReactionRoleManager = require('../managers/ReactionRoleManager');
const formatDiscordRegion = require('../utils/formatDiscordRegion');

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
        this.countManager = new CountManager(client, this);

        /**
         * @constant
         * @private
         */
        this.tierManager = new TierManager(client, this);

        /**
         * @constant
         * @private
         */
        this.triggerManager = new TriggerManager(client, this);

        /**
         * @constant
         * @private
         */
        this.reactionRoleManager = new ReactionRoleManager(client, this);
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
     * @param {Discord.EmbedFieldData[]} fields
     */
    async log(title, description, fields) {
        if (this.modlog) {
            try {
                const locale = formatDiscordRegion(this.guild.region);
                const date = new Date().toLocaleDateString('en-US', { timeZone: locale, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                const time = new Date().toLocaleTimeString('en-US', { timeZone: locale, hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`[LOG] ${title}`)
                    .setColor('ORANGE')
                    .setFooter(`${date} • ${(time.startsWith('0') ? time.substring(1) : time)} • ${this.guild.region.toLocaleUpperCase()}`);
                if (description) {
                    embed.setDescription(description);
                }
                if (fields) {
                    embed.addFields(fields);
                }

                return await this.modlog.send(embed);
            } catch (err) {
                console.log(err);
            }
        }
    }

    async save() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        console.log(`[SERVER] Saved server ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.serverDeleteQuery, [this.id]);
        console.log(`[SERVER] Deleted server ${this.guild.name}`);
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

        console.log(`[SERVER] Loaded server ${this.guild.name}`);
    }

    getTicketManager() { return this.ticketManager; }
    getAttendanceManager() { return this.attendanceManager; }
    getCountManager() { return this.countManager; }
    getTierManager() { return this.tierManager; }
    getTriggerManager() { return this.triggerManager; }
    getReactionRoleManager() { return this.reactionRoleManager; }
}

module.exports = Server;