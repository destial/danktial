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
const Ticket = require('./Ticket');
const Tier = require('./Tier');
const Attendance = require('./Attendance');
const AdvancedAttendance = require('./AdvancedAttendance');
const TicketPanel = require('./TicketPanel');
const { Logger } = require('../utils/Utils');

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
        this.subbedChannels = [];
        this.premium = false;
        
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

        // this.alerts = new TwitchRequest.Client({
        //     channels: [],
        //     client_id: process.env.CLIENT_ID,
        //     client_secret: process.env.CLIENT_SECRET,
        //     interval: 3
        // });

        // this.alerts.on('live', (stream) => {
        //     if (this.alertChannel) {
        //         const embed = new Discord.MessageEmbed();
        //         embed.setAuthor(`${stream.name} is now live!`, stream.profile, `https://www.twitch.tv/${stream.name}`);
        //         embed.setTitle(stream.title);
        //         embed.setURL(`https://www.twitch.tv/${stream.name}`);
        //         embed.addFields([
        //             { name: 'Playing', value: stream.game, inline: true }
        //         ]);
        //         embed.setImage(stream.thumbnail);
        //         embed.setColor('DARK_PURPLE');
        //         embed.setThumbnail(stream.profile);
        //         embed.setTimestamp(stream.startedAt);
        //         this.alertChannel.send(embed);
        //     }
        // });
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
                return await this.modlog.send(embed);
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
            }
        }
    }

    async loadData(data) {
        this.prefix = data.prefix;
        this.modlog = this.guild.channels.cache.get(data.log);
        this.joinEmbed = (data.embed != null ? new Discord.MessageEmbed(data.embed) : undefined);
        
        this.enableTickets = data.tickets.enabled;
        this.ticketManager.totaltickets = data.tickets.total;
        data.tickets.open.forEach(async ticket => {
            try {
                const member = await this.guild.members.fetch(ticket.member);
                const channel = this.guild.channels.cache.get(ticket.id);
                if (channel && member && channel.isText()) {
                    const base = await channel.messages.fetch(ticket.base);
                    const t = new Ticket(member, ticket.number, channel, base, this.ticketManager);
                    this.ticketManager.loadTicket(t);
                    Logger.boot(`[LOAD] Loaded ticket ${t.number}`);
                }
            } catch(err) {
                Logger.warn(`[TICKET] Missing ticket member ${ticket.member} or channel ${ticket.id} under ${this.guild.name}`);
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[TICKET] Missing ticket member ${ticket.member} or channel ${ticket.id} under ${this.guild.name}`);
            }
        });
        data.tickets.panels.forEach(async panel => {
            const channel = this.guild.channels.cache.get(panel.channel);
            if (channel && channel.isText()) {
                try {
                    const message = await channel.messages.fetch(panel.id);
                    if (message) {
                        const p = new TicketPanel(this.client, this.ticketManager, message.id, message.embeds[0], channel);
                        this.ticketManager.loadTicketPanel(p);
                    }
                } catch(err) {
                    Logger.warn(`[TICKETPANEL] Missing ticket panel ${panel.id} under ${this.guild.name}`);
                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[TICKETPANEL] Missing ticket panel ${panel.id} under ${this.guild.name}`);
                }
            }
        });
        if (data.count.member != null) {
            const count = this.guild.channels.cache.get(data.count.member);
            this.countManager.setCount('member', count);
        }
        if (data.count.role != null) {
            const count = this.guild.channels.cache.get(data.count.role);
            this.countManager.setCount('role', count);
        }
        if (data.count.channel != null) {
            const membercount = this.guild.channels.cache.get(data.count.channel);
            this.countManager.setCount('channel', membercount);
        }

        data.tiers.forEach(async tier => {
            const t = new Tier(this.client, this, tier.name);
            await t.loadJSON(tier);
            this.tierManager.tiers.sort((a, b) => a.name.localeCompare(b.name));
        });

        data.attendances.forEach(attendance => {
            const a = new Attendance(undefined, attendance.id, new Date(attendance.date), this.guild, undefined, this.client);
            a.loadJSON(attendance);
        });

        data.advancedAttendances.forEach(attendance => {
            const a = new AdvancedAttendance(this.client, undefined, this, undefined, new Date(attendance.date), this.attendanceManager);
            a.loadJSON(attendance);
        });
        this.alertChannel = this.guild.channels.cache.get(data.twitch.alertChannel);

        data.twitch.subscribedChannels.forEach(async id => {
            this.subbedChannels.push(id);
            //const user = await this.alerts.resolveID(id);
            // if (user) {
            //     //this.alerts.addChannel(user.name);
            //     console.log(`[TWITCH] Loaded channel ${user.name} to ${this.guild.name}`);
            //     this.subbedChannels.push(user.id);
            // }
        });
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[SERVER] Loaded ${this.guild.name}`);
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
            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
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
            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
        }
    }

    /**
     * 
     * @param {string} string 
     */
    async addChannel(string) {
        //this.alerts.addChannel(string);
        //const user = await this.alerts.getUser(string.toLowerCase());
        this.subbedChannels.push(user.id);
    }

    /**
     * 
     * @param {string} string 
     */
    async removeChannel(string) {
        //this.alerts.removeChannel(string);
        //const user = await this.alerts.getUser(string.toLowerCase());
        const index = this.subbedChannels.indexOf(user.id);
        if (index !== -1) {
            this.subbedChannels.splice(index, 1);
        }
    }

    /**
     * 
     * @param {Discord.TextChannel} channel 
     */
    setAlerts(channel) {
        this.alertChannel = channel;
        this.update();
        if (channel) {
            Logger.info(`[SERVER] Set alerts channel of ${this.guild.name} to #${channel.name}`);
        } else {
            Logger.warn(`[SERVER] Removed alerts channel of ${this.guild.name}`);
        }
    }

    async save() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, JSON.stringify(this.toJSON())]);
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        Logger.info(`[SERVER] Saved server ${this.guild.name}`);
    }

    async update() {
        await Database.run(Database.serverSaveQuery, [this.id, this.prefix, this.ticketManager.totaltickets, (this.modlog ? this.modlog.id : 0)]);
        await Database.run(Database.serverDataUpdateQuery, [this.id, JSON.stringify(this.toJSON())]);
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        Logger.info(`[SERVER] Updated server ${this.guild.name}`);
    }

    async delete() {
        await Database.run(Database.serverDeleteQuery, [this.id]);
        await Database.run(Database.serverDataDeleteQuery, [this.id]);
        await Database.runNewDB(Database.getStatement('delete'), [this.id]);
        Logger.warn(`[SERVER] Deleted server ${this.guild.name}`);
    }

    async backup() {
        await Database.runNewDB(Database.getStatement('update'), [this.id, JSON.stringify(this.toJSON())]);
        Logger.info(`[BACKUP] Backed up server ${this.guild.name}`);
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
        Logger.boot(`[SERVER] Loaded server ${this.guild.name}`);
    }

    /**
     * 
     * @param {Discord.MessageEmbed} joinEmbed 
     */
    loadEmbed(joinEmbed) {
        this.joinEmbed = joinEmbed;
        Logger.boot(`[SERVER] Loaded embed from server ${this.guild.name}`);
    }

    async loadJSON(object) {
        try {
            const guild = await this.client.guilds.fetch(object.id);
            if (guild) {
                this.premium = object.premium;
                this.enableTickets = object.tickets.enabled;
                this.alertChannel = this.guild.channels.cache.get(object.twitch.alertChannel);
                object.twitch.subscribedChannels.forEach(channel => {
                    this.alerts.addChannel(channel);
                });
            }
        } catch(err) {
            Logger.boot(`[SERVER] Missing server ${object.id}`);
        }
    }

    toJSON() {
        // this.
        // this.alerts.allChannels().forEach(tc => {
        //     channels.push(tc.user.id);
        // });
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
            premium: this.premium,
            tickets: {
                enabled: this.enableTickets,
                total: this.ticketManager.totaltickets,
                open: openTicketData,
                panels: ticketPanelsData
            },
            twitch: {
                subscribedChannels: this.subbedChannels,
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