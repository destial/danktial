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
const Ticket = require('./Ticket');
const Tier = require('./Tier');
const Attendance = require('./Attendance');
const AdvancedAttendance = require('./AdvancedAttendance');
const TicketPanel = require('./TicketPanel');

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

    async loadData(data) {
        this.prefix = data.prefix;
        this.log = this.guild.channels.cache.get(data.log);
        this.joinEmbed = (data.embed != null ? new Discord.MessageEmbed(data.embed) : undefined);
        
        this.enableTickets = data.tickets.enabled;
        this.getTicketManager().totaltickets = data.tickets.total;
        data.tickets.open.forEach(async ticket => {
            const member = await this.guild.members.fetch(ticket.member);
            const channel = this.guild.channels.cache.get(ticket.id);
            if (channel && member && channel.isText()) {
                const base = await channel.messages.fetch(ticket.base);
                const t = new Ticket(member, ticket.number, channel, base, this.getTicketManager());
                this.getTicketManager().loadTicket(t);
                console.log(`[LOAD] Loaded ticket ${t.number}`);
            }
        });
        data.tickets.panels.forEach(async panel => {
            const channel = this.guild.channels.cache.get(panel.channel);
            if (channel && channel.isText()) {
                const message = await channel.messages.fetch(panel.id);
                if (message) {
                    const p = new TicketPanel(this.client, this.getTicketManager(), message.id, message.embeds[0], channel);
                    this.getTicketManager().loadTicketPanel(p);
                }
            }
        });
        if (data.count.member != null) {
            const count = this.guild.channels.cache.get(data.count.member);
            this.getCountManager().setCount('member', count);
        }
        if (data.count.role != null) {
            const count = this.guild.channels.cache.get(data.count.role);
            this.getCountManager().setCount('role', count);
        }
        if (data.count.channel != null) {
            const membercount = this.guild.channels.cache.get(data.count.channel);
            this.getCountManager().setCount('channel', membercount);
        }

        data.tiers.forEach(tier => {
            const t = new Tier(this.client, this, tier.name);
            t.loadJSON(tier);
        });

        data.attendances.forEach(attendance => {
            const a = new Attendance(undefined, attendance.id, new Date(attendance.date), this.guild, undefined, this.client);
            a.loadJSON(attendance);
        });

        data.advancedAttendances.forEach(attendance => {
            const a = new AdvancedAttendance(this.client, undefined, this, undefined, new Date(attendance.date), this.getAttendanceManager());
            a.loadJSON(attendance);
        });
        this.alertChannel = this.guild.channels.cache.get(data.twitch.alertChannel);

        data.twitch.subscribedChannels.forEach(channel => {
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

    async save() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, JSON.stringify(this.toJSON())]);
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        console.log(`[SERVER] Saved server ${this.guild.name}`);
    }

    async update() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, JSON.stringify(this.toJSON())]);
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        console.log(`[SERVER] Updated server ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.serverDeleteQuery, [this.id]);
        await Database.run(Database.serverDataDeleteQuery, [this.id]);
        await Database.runNewDB(Database.getStatement('delete'), [this.id]);
        console.log(`[SERVER] Deleted server ${this.guild.name}`);
    }

    async backup() {
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        console.log(`[BACKUP] Backed up server ${this.guild.name}`);
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
        const ticketPanelsData = [];
        this.getTicketManager().ticketpanels.forEach(panel => {
            ticketPanelsData.push(panel.toJSON());
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
                panels: ticketPanelsData
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