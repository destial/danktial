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
const TwitchRequest = require('twitchrequest');
//const serverSchema = require('../database/schemas/server-schema');

class Server {
    /**
     * @param {Discord.Client} client
     * @param {Discord.Guild} guild 
     * @param {Discord.TextChannel} modlog
     * @param {string} prefix
     * @param {number} tickets
     * @param {ServerManager} serverManager
     * @param {Discord.TextChannel} alertChannel
     */
    constructor(client, guild, modlog, prefix, tickets, serverManager, alertChannel) {
        this.client = client;
        this.id = guild.id;
        this.guild = guild;
        this.modlog = modlog;
        this.alertChannel = alertChannel;
        this.prefix = prefix || "-";
        this.joinEmbed = undefined;
        this.serverManager = serverManager;
        this.enableTickets = true;
        
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

        this.alerts = new TwitchRequest.Client({
            channels: [],
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            interval: 3
        });

        this.alerts.on('live', data => {
            if (this.alertChannel) {
                const embed = new Discord.MessageEmbed();
                embed.setAuthor(`${data.name} is now live! Playing ${data.game}`, data.profile, `https://www.twitch.tv/${data.name}`);
                embed.setTitle(data.title);
                embed.setURL(`https://www.twitch.tv/${data.name}`);
                embed.addFields([
                    { name: 'Topic', value: data.game, inline: true },
                    { name: 'Viewers', value: data.viewers, inline: true }
                ]);
                embed.setImage(data.thumbnail);
                embed.setColor("DARK_PURPLE");
                embed.setThumbnail(data.profile);
                embed.setTimestamp(data.date);
                this.alertChannel.send(embed);
            }
        });
    }

    loadData(data) {
        this.enableTickets = data.enableTickets;
        this.alertChannel = this.guild.channels.cache.get(data.alertChannel);
        data.subscribedChannels.forEach(channel => {
            this.alerts.addChannel(channel);
        });
    }

    /**
     * 
     * @param {string} prefix 
     */
    async setPrefix(prefix) { 
        this.prefix = prefix;
        try {
            await this.update();
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
            await this.update();
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 
     * @param {string} string 
     */
    addChannel(string) {
        this.alerts.addChannel(string);
    }

    /**
     * 
     * @param {string} string 
     */
    removeChannel(string) {
        this.alerts.removeChannel(string);
    }

    /**
     * 
     * @param {Discord.TextChannel} channel 
     */
    setAlerts(channel) {
        this.alertChannel = channel;
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
                    .setAuthor(title)
                    .setColor('ORANGE')
                    .setFooter(`${date} • ${(time.startsWith('0') ? time.substring(1) : time)} • ${this.guild.region.toLocaleUpperCase()}`);
                if (description) {
                    embed.setDescription(description);
                }
                if (fields) {
                    embed.addFields(fields);
                }
                this.modlog.stopTyping(true);
                return await this.modlog.send(embed);
            } catch (err) {
                console.log(err);
            }
        }
    }

    async save() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, this.toJSON()]);
        //await serverSchema.create({ id: this.id, prefix: this.prefix, tickets: String(this.ticketManager.totaltickets), log: (this.modlog ? this.modlog.id : '0') });
        console.log(`[SERVER] Saved server ${this.guild.name}`);
    }

    async update() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, this.toJSON()]);
        //await serverSchema.findOneAndUpdate({ id: this.id }, { prefix: this.prefix, tickets: String(this.ticketManager.totaltickets), log: (this.modlog ? this.modlog.id : '0') });
        console.log(`[SERVER] Updated server ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.serverDeleteQuery, [this.id]);
        await Database.run(Database.serverDataDeleteQuery, [this.id]);
        //await serverSchema.deleteOne({ id: this.id });
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
        this.ticketManager.totaltickets = Number(tickets);
        console.log(`[SERVER] Loaded server ${this.guild.name}`);
    }

    /**
     * 
     * @param {Discord.MessageEmbed} joinEmbed 
     */
    loadEmbed(joinEmbed) {
        this.joinEmbed = joinEmbed;
        console.log(`[SERVER] Loaded embed from server ${this.guild.name}`);
    }

    async loadJSON(object) {
        try {
            const guild = await this.client.guilds.fetch(object.id);
            if (guild) {
                // this.id = guild.id;
                // this.guild = guild;
                // this.prefix = object.prefix;
                // this.ticketManager.totaltickets = Number(object.tickets);
                // this.embed = new Discord.MessageEmbed(object.embed);
                // this.modlog = guild.channels.cache.get(object.log);
                this.enableTickets = object.enableTickets;
                this.alertChannel = this.guild.channels.cache.get(object.alertChannel);
                object.subscribedChannels.forEach(channel => {
                    this.alerts.addChannel(channel);
                });
            }
        } catch(err) {
            console.log(`[SERVER] Missing server ${object.id}`);
        }
    }

    toJSON() {
        const channels = [];
        this.alerts.allChannels().forEach(tc => {
            channels.push(tc.name);
        });
        const tiersData = [];
        this.getTierManager().tiers.forEach(tier => {
            tiersData.push(tier.toJSON());
        });
        const attendanceData = [];
        this.getAttendanceManager().getEvents().forEach(attendance => {
            attendanceData.push(attendance.toJSON());
        });
        const advancedAttendanceData = [];
        this.getAttendanceManager().getAdvancedEvents().forEach(attendance => {
            advancedAttendanceData.push(attendance.toJSON());
        })
        const openTicketData = [];
        this.getTicketManager().opentickets.forEach(ticket => {
            openTicketData.push(ticket.toJSON());
        });
        return {
            id: this.id,
            prefix: this.prefix,
            log: (this.modlog ? this.modlog.id : null),
            embed: (this.joinEmbed ? this.joinEmbed.toJSON() : null),
            tickets: {
                enabled: this.enableTickets,
                total: this.ticketManager.totaltickets,
                open: openTicketData,
            },
            twitch: {
                subscribedChannels: channels,
                alertChannel: (this.alertChannel ? this.alertChannel.id : null),
            },
            count: {
                member: (this.getCountManager().getCount('member') ? this.getCountManager().getCount('member').id : null),
                role: (this.getCountManager().getCount('role') ? this.getCountManager().getCount('role').id : null),
                channel: (this.getCountManager().getCount('channel') ? this.getCountManager().getCount('channel').id : null),
            },
            tiers: tiersData,
            attendances: attendanceData,
            advancedAttendances: advancedAttendanceData,
        };
    }

    toString() {
        return `${this.guild}`;
    }

    getTicketManager() { return this.ticketManager; }
    getAttendanceManager() { return this.attendanceManager; }
    getCountManager() { return this.countManager; }
    getTierManager() { return this.tierManager; }
    getTriggerManager() { return this.triggerManager; }
    getReactionRoleManager() { return this.reactionRoleManager; }
}

module.exports = Server;