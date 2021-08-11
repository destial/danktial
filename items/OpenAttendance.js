const Discord = require('discord.js');
const Server = require('./Server');
const Tier = require('./Tier');
const Driver = require('./Driver');
const Database = require('../database/Database');
const schedule = require('node-schedule');
const { Logger } = require('../utils/Utils');
const { MessageButton, MessageActionRow } = require('discord-buttons');
const formatDateURL = require('../utils/formatDateURL');

class OpenAttendance {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {Server} server
     * @param {Tier} tier
     * @param {Date} date
     */
    constructor(client, message, server, tier, date, attendanceManager) {
        this.type = '';
        this.timezone = '';
        this.attendanceType = 'open';
        this.client = client;
        this.message = message;
        if (this.message) {
            this.embed = message.embeds[0];
        }
        this.server = server;
        if (this.message) {
            this.id = message.id;
        }
        this.date = new Date(date);
        this.attendanceManager = attendanceManager;
        this.tier = tier;
        this.creator = undefined;

        /**
         * @type {Discord.Collection<string, Driver>}
         */
        this.accepted = new Discord.Collection();

        /**
         * @type {Discord.Collection<string, Driver>}
         */
        this.rejected = new Discord.Collection();

        /**
         * @type {Discord.Collection<string, Driver>}
         */
        this.tentative = new Discord.Collection();

        /**
         * @type {Discord.Collection<string, Driver>}
         */
        this.unknown = new Discord.Collection();

        if (this.embed) {
            this.embed.fields.forEach(field => {
                if (field.value.includes('\n') || field.name !== "Date & Time") {
                    const splits = field.value.split('\n');
                    if (!splits.length && field.value !== '-') {
                        splits.push(field.value);
                    }
                    splits.forEach(value => {
                        if (value.startsWith(OpenAttendance.rejectEmoji)) {
                            const raw = value.replace(`${OpenAttendance.rejectEmoji} `, '');
                            const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                            const driver = this.tier.getDriver(id);
                            const reserve = this.tier.getReserve(id);
                            if (driver) {
                                this.rejected.set(driver.id, driver);
                            } else if (reserve) {
                                this.rejected.set(reserve.id, reserve);
                            }
                        }

                        if (value.startsWith(OpenAttendance.acceptEmoji)) {
                            const raw = value.replace(`${OpenAttendance.acceptEmoji} `, '');
                            const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                            const driver = this.tier.getDriver(id);
                            const reserve = this.tier.getReserve(id);
                            if (driver) {
                                this.accepted.set(driver.id, driver);
                            } else if (reserve) {
                                this.accepted.set(reserve.id, reserve);
                            }
                        }

                        if (value.startsWith(OpenAttendance.maybeEmoji)) {
                            const raw = value.replace(`${OpenAttendance.maybeEmoji} `, '');
                            const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                            const driver = this.tier.getDriver(id);
                            const reserve = this.tier.getReserve(id);
                            if (driver) {
                                this.tentative.set(driver.id, driver);
                            } else if (reserve) {
                                this.tentative.set(reserve.id, reserve);
                            }
                        }

                        if (value.startsWith(OpenAttendance.unknownEmoji)) {
                            const raw = value.replace(`${OpenAttendance.unknownEmoji} `, '');
                            const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                            const driver = this.tier.getDriver(id);
                            const reserve = this.tier.getReserve(id);
                            if (driver) {
                                this.unknown.set(driver.id, driver);
                            } else if (reserve) {
                                this.unknown.set(reserve.id, reserve);
                            }
                        }
                    });
                }
            });
        }

        const fiveMinBefore = this.date.getTime() - 600000;
        if (fiveMinBefore > new Date().getTime()) {
            this.schedule = schedule.scheduleJob(`reminderchecked${this.id}`, new Date(fiveMinBefore), () => {
                this.accepted.forEach((participant) => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`You have an upcoming race in ${this.server.guild.name} in 10 minutes!`);
                    embed.setColor('RED');
                    embed.setDescription(this.embed.title);
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.setLocked(true);
                this.message.reactions.removeAll();
                this.schedule.cancel();
            });
            Logger.info(`[ADATTENDANCE] Created new schedule for ${this.schedule.name} at ${new Date(fiveMinBefore).toString()}`);
        }
        const twoHoursBefore = this.date.getTime() - 7200000;
        if (twoHoursBefore > new Date().getTime()) {
            this.reminder = schedule.scheduleJob(`reminderunchecked${this.id}`, new Date(twoHoursBefore), () => {
                this.unknown.forEach(participant => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`You have not responded in ${this.server.guild.name} yet!`);
                    embed.setDescription(`Reminder to respond to the attendance!\n${this.embed.title}`);
                    embed.setColor('RED');
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.tentative.forEach(participant => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`Are you racing in ${this.server.guild.name}?`);
                    embed.setDescription(`Reminder to check-in for the attendance!\n${this.embed.title}`);
                    embed.setColor('RED');
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.reminder.cancel();
            });
        }

        this.locked = false;
    }

    static get acceptEmoji() { return "🟢"; }
    static get rejectEmoji() { return "🔴"; }
    static get maybeEmoji() { return "🔵"; }
    static get unknownEmoji() { return "🟠"; }
    static get editEmoji() { return "✏️"; }
    static get lockEmoji() { return "🔒"; }
    static get unlockEmoji() { return "🔓"; }

    /**
     * 
     * @param {Driver} driver 
     */
    async accept(driver) {
        const field = this.embed.fields.find(field => field.value.includes(driver.id));
        if (!field) return;
        const value = field.value.replace('!', '');
        const index = value.indexOf(driver.id)-2;
        const firstHalf = value.substring(0, index-3);
        const secondHalf = value.substring(index-1);

        if (!this.accepted.get(driver.id)) {
            field.value = firstHalf + OpenAttendance.acceptEmoji + secondHalf;
            this.accepted.set(driver.id, driver);
            this.rejected.delete(driver.id);
            this.tentative.delete(driver.id);
            this.unknown.delete(driver.id);
        } else {
            field.value = firstHalf + OpenAttendance.unknownEmoji + secondHalf;
            this.accepted.delete(driver.id);
            this.unknown.set(driver.id, driver);
        }
        this.edit();
    }

    /**
     * 
     * @param {Driver} driver 
     */
    async reject(driver) {
        const field = this.embed.fields.find(field => field.value.includes(driver.id));
        if (!field) return;
        const value = field.value.replace('!', '');
        const index = value.indexOf(driver.id)-2;
        const firstHalf = value.substring(0, index-3);
        const secondHalf = value.substring(index-1);

        if (!this.rejected.get(driver.id)) {
            field.value = firstHalf + OpenAttendance.rejectEmoji + secondHalf;
            this.rejected.set(driver.id, driver);
            this.accepted.delete(driver.id);
            this.tentative.delete(driver.id);
            this.unknown.delete(driver.id);
        } else {
            field.value = firstHalf + OpenAttendance.unknownEmoji + secondHalf;
            this.rejected.delete(driver.id);
            this.unknown.set(driver.id, driver);
        }
        this.edit();
    }

    /**
     * 
     * @param {Driver} driver 
     */
    async maybe(driver) {
        const field = this.embed.fields.find(field => field.value.includes(driver.id));
        if (!field) return;
        const value = field.value.replace('!', '');
        const index = value.indexOf(driver.id)-2;
        const firstHalf = value.substring(0, index-3);
        const secondHalf = value.substring(index-1);

        if (!this.tentative.get(driver.id)) {
            field.value = firstHalf + OpenAttendance.maybeEmoji + secondHalf;
            this.tentative.set(driver.id, driver);
            this.rejected.delete(driver.id);
            this.accepted.delete(driver.id);
            this.unknown.delete(driver.id);
        } else {
            field.value = firstHalf + OpenAttendance.unknownEmoji + secondHalf;
            this.tentative.delete(driver.id);
            this.unknown.set(driver.id, driver);
        }
        this.edit();
    }

    async reset() {
        const promise = new Promise((resolve,reject) => {
            this.embed.spliceFields(1, this.embed.fields.length-1);
            this.tier.teams.forEach(team => {
                var driverList = '';
                team.drivers.forEach(driver => {
                    driverList += `${OpenAttendance.unknownEmoji} ${driver.member}\n`;
                });
                this.embed.addField(team.name, driverList, false);
            });
            if (this.tier.reserves.size !== 0) {
                var reserveList = '';
                this.tier.reserves.forEach(reserve => {
                    reserveList += `${OpenAttendance.unknownEmoji} ${reserve.member}\n`;
                });
                this.embed.addField('Reserves', reserveList, false);
            }
            resolve();
        });

        promise.then(() => {
            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Reset attendance ${this.embed.title}`);
            this.edit();
        });
    }

    async fix(remove_R) {
        var hasReserves = false;
        for (const field of this.embed.fields) {
            const team = this.tier.getTeam(field.name);
            if (team) {
                const driverArray = field.value.split('\n');
                if (!driverArray.length) {
                    driverArray.push(field.value);
                }
                const driverIDArray = [];
                driverArray.forEach((rawString, index) => {
                    const id = rawString.replace('<@', '').replace('>', '').replace('!', '').replace(' ', '')
                        .replace(OpenAttendance.acceptEmoji, '')
                        .replace(OpenAttendance.rejectEmoji, '')
                        .replace(OpenAttendance.maybeEmoji, '')
                        .replace(OpenAttendance.unknownEmoji, '');
                    driverIDArray.push(id);
                    if (!team.drivers.get(id)) {
                        driverArray.splice(index, 1);
                    }
                });
                const driverIDValidArray = team.drivers.keyArray();
                const differenceCache = driverIDValidArray.filter(a => !driverIDArray.includes(a) && (a !== '' || a !== '-'));
                const differencePost = driverIDArray.filter(a => !driverIDValidArray.includes(a) &&  (a !== '-'));
                for (const diff of differenceCache) {
                    driverArray.push(`${OpenAttendance.unknownEmoji} <@${diff}>`);
                }
                for (const diff of differencePost) {
                    const index = driverIDArray.indexOf(diff);
                    if (index > -1) {
                        driverArray.splice(index, 1);
                        const id = driverIDArray[index];
                        this.accepted.delete(id);
                        this.rejected.delete(id);
                        this.tentative.delete(id);
                        this.unknown.delete(id);
                    }
                }
                if (differenceCache.length || differencePost.length) {
                    field.value = (driverArray.length ? driverArray.join('\n') : '-');
                }
            } else if (field.name.toLowerCase().includes('reserves')) {
                hasReserves = true;
                const driverArray = field.value.split('\n');
                if (!driverArray.length) {
                    driverArray.push(field.value);
                }
                const driverIDArray = [];
                driverArray.forEach((rawString, index) => {
                    const id = rawString.replace('<@', '').replace('>', '').replace('!', '').replace(' ', '')
                        .replace(OpenAttendance.acceptEmoji, '')
                        .replace(OpenAttendance.rejectEmoji, '')
                        .replace(OpenAttendance.maybeEmoji, '')
                        .replace(OpenAttendance.unknownEmoji, '');
                    driverIDArray.push(id);
                    if (!this.tier.reserves.get(id)) {
                        driverArray.splice(index, 1);
                    }
                });
                const driverIDValidArray = this.tier.reserves.keyArray();
                const differenceCache = driverIDValidArray.filter(a => !driverIDArray.includes(a) && (a !== '' || a !== '-'));
                const differencePost = driverIDArray.filter(a => !driverIDValidArray.includes(a) &&  (a !== '-'));
                for (const diff of differenceCache) {
                    driverArray.push(`${OpenAttendance.unknownEmoji} <@${diff}>`);
                }
                for (const diff of differencePost) {
                    const index = driverIDArray.indexOf(diff);
                    if (index > -1) {
                        driverArray.splice(index, 1);
                        const id = driverIDArray[index];
                        this.accepted.delete(id);
                        this.rejected.delete(id);
                        this.tentative.delete(id);
                        this.unknown.delete(id);
                    }
                }
                if (differenceCache.length || differencePost.length) {
                    field.value = (driverArray.length ? driverArray.join('\n') : '-');
                }
            }
        }
        if (!hasReserves && this.tier.reserves.size !== 0) {
            var reserveList = '';
            for (const reserve of this.tier.reserves.values()) {
                reserveList += `${OpenAttendance.unknownEmoji} ${reserve.member}\n`;
            }
            this.embed.addField('🇷 Reserves', reserveList, false);
        }
        await this.edit();
        if (remove_R) {
            this.message.reactions.removeAll();
        }
    }

    /**
     * 
     * @param {string} oldTeamName 
     * @param {string} newTeamName 
     */
    async fixTeams(oldTeamName, newTeamName) {
        for (const field of this.embed.fields) {
            if (field.name === oldTeamName) {
                field.name = newTeamName;
            }
        }
        this.edit();
    }

    async edit() {
        return await this.message.edit({embed: this.embed});
    }

    async update() {
        // Database.run(Database.advancedAttendanceUpdateQuery, [String(this.date.getTime()), this.id, this.message.channel.id]);
        this.server.update();
        Logger.info(`[ADATTENDANCE] Updated attendance ${this.embed.title} from ${this.server.guild.name}`);
    }

    async delete() {
        if (this.schedule) {
            this.schedule.cancel();
        }
        if (this.reminder) {
            this.reminder.cancel();
        }
        this.server.update();
        // Database.run(Database.advancedAttendanceDeleteQuery, [this.id]);
        Logger.warn(`[OPATTENDANCE] Deleted attendance ${this.embed.title} from ${this.server.guild.name}`);
    }

    async save() {
        // Database.run(Database.advancedAttendanceSaveQuery, [this.id, String(this.date.getTime()), this.message.channel.id, this.tier.name]);
        this.server.update();
        Logger.info(`[OPATTENDANCE] Saved attendance ${this.embed.title} from ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {Date} date 
     * @param {string} dateString 
     */
    updateDate(date, dateString) {
        this.date = date;
        this.embed.setTimestamp(date);
        if (this.schedule) {
            this.schedule.cancel();
        }
        const fiveMinBefore = this.date.getTime() - 600000;
        if (fiveMinBefore > new Date().getTime()) {
            this.schedule = schedule.scheduleJob(`remindercheckedopen${this.id}`, new Date(fiveMinBefore), () => {
                this.accepted.forEach((participant) => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`You have an upcoming race in ${this.server.guild.name} in 10 minutes!`);
                    embed.setColor('RED');
                    embed.setDescription(this.embed.title);
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.setLocked(true);
                this.message.reactions.removeAll();
                this.schedule.cancel();
            });
        }
        const twoHoursBefore = this.date.getTime() - 7200000;
        if (this.reminder) {
            this.reminder.cancel();
        }
        if (twoHoursBefore > new Date().getTime()) {
            this.reminder = schedule.scheduleJob(`reminderuncheckedopen${this.id}`, new Date(twoHoursBefore), () => {
                this.unknown.forEach(participant => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`You have not responded in ${this.server.guild.name} yet!`);
                    embed.setDescription(`Reminder to respond to the attendance!\n${this.embed.title}`);
                    embed.setColor('RED');
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.tentative.forEach(participant => {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`Are you racing in ${this.server.guild.name}?`);
                    embed.setDescription(`Reminder to check-in for the attendance!\n${this.embed.title}`);
                    embed.setColor('RED');
                    try {
                        participant.member.user.send(embed);
                    } catch(err) {}
                });
                this.reminder.cancel();
            });
        }
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Edited schedule for ${this.schedule.name} to ${new Date(fiveMinBefore).toString()}`);
        this.embed.spliceFields(0, 1, {
            name: "Date & Time", value: `[${dateString}]${formatDateURL(date)}`, inline: false
        });
        this.edit();
        this.update();
    }

    async loadJSON(object) {
        this.server = await this.client.manager.fetch(object.guild);
        if (this.server) {
            const channel = this.server.guild.channels.cache.get(object.channel);
            if (channel && channel.isText()) {
                try {
                    this.message = await channel.messages.fetch(object.id);
                    if (object.creator) {
                        this.creator = await this.server.guild.members.fetch(object.creator);
                    }
                } catch(err) {
                    Logger.warn(`[OPATTENDANCE] Missing openattendance id ${object.id} from ${object.guild}`);
                    this.message = undefined;
                    return;
                }
                if (this.message) {
                    this.id = this.message.id;
                    this.embed = this.message.embeds[0];
                    this.date = new Date(object.date);
                    this.accepted.clear();
                    this.rejected.clear();
                    this.tentative.clear();
                    this.unknown.clear();
                    this.type = 'open';
                    this.tier = this.server.getTierManager().getTier(object.tier);
                    if (object.locked) {
                        this.locked = object.locked;
                    }
                    this.loadAttendees(this.embed);

                    if (this.schedule) {
                        this.schedule.cancel();
                    }
                    const fiveMinBefore = this.date.getTime() - 600000;
                    if (fiveMinBefore > Date.now()) {
                        this.schedule = schedule.scheduleJob(`remindercheckedopen${this.id}`, new Date(fiveMinBefore), () => {
                            this.accepted.forEach((participant) => {
                                const embed = new Discord.MessageEmbed();
                                embed.setAuthor(`You have an upcoming race in ${this.server.guild.name} in 10 minutes!`);
                                embed.setColor('RED');
                                embed.setDescription(this.embed.title);
                                try {
                                    participant.member.user.send(embed);
                                } catch(err) {}
                            });
                            this.setLocked(true);
                            this.schedule.cancel();
                        });
                        Logger.boot(`[OPATTENDANCE] Created schedule for ${this.embed.title}`);
                    }
                    if (this.reminder) {
                        this.reminder.cancel();
                    }
                    const twoHoursBefore = this.date.getTime() - 7200000;
                    if (twoHoursBefore > new Date().getTime()) {
                        this.reminder = schedule.scheduleJob(`reminderuncheckedopen${this.id}`, new Date(twoHoursBefore), () => {
                            this.unknown.forEach(participant => {
                                const embed = new Discord.MessageEmbed();
                                embed.setAuthor(`You have not responded in ${this.server.guild.name} yet!`);
                                embed.setDescription(`Reminder to respond to the attendance!\n${this.embed.title}`);
                                embed.setColor('RED');
                                try {
                                    participant.member.user.send(embed);
                                } catch(err) {}
                            });
                            this.tentative.forEach(participant => {
                                const embed = new Discord.MessageEmbed();
                                embed.setAuthor(`Are you racing in ${this.server.guild.name}?`);
                                embed.setDescription(`Reminder to check-in for the attendance!\n${this.embed.title}`);
                                embed.setColor('RED');
                                try {
                                    participant.member.user.send(embed);
                                } catch(err) {}
                            });
                            this.reminder.cancel();
                        });
                    }
                    this.server.getAttendanceManager().getOpenEvents().set(this.id, this);
                    Logger.boot(`[OPATTENDANCE] Loaded ${this.embed.title} from ${this.server.guild.name}`);
                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Loaded ${this.embed.title} from ${this.server.guild.name}`);
                }
            }
        }
    }

    /**
     * 
     * @param {Discord.MessageEmbed} embed 
     */
    loadAttendees(embed) {
        this.accepted.clear();
        this.rejected.clear();
        this.tentative.clear();
        this.unknown.clear();
        embed.fields.forEach(field => {
            if (field.name !== "Date & Time") {
                const splits = field.value.split('\n');
                if (!splits.length && field.value !== '-') {
                    splits.push(field.value);
                }
                splits.forEach(value => {
                    if (value.startsWith(OpenAttendance.rejectEmoji)) {
                        const raw = value.replace(`${OpenAttendance.rejectEmoji} `, '');
                        const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                        const driver = this.tier.getDriver(id);
                        const reserve = this.tier.getReserve(id);
                        if (driver) {
                            this.rejected.set(driver.id, driver);
                        } else if (reserve) {
                            this.rejected.set(reserve.id, reserve);
                        }
                    }

                    if (value.startsWith(OpenAttendance.acceptEmoji)) {
                        const raw = value.replace(`${OpenAttendance.acceptEmoji} `, '');
                        const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                        const driver = this.tier.getDriver(id);
                        const reserve = this.tier.getReserve(id);
                        if (driver) {
                            this.accepted.set(driver.id, driver);
                        } else if (reserve) {
                            this.accepted.set(reserve.id, reserve);
                        }
                    }

                    if (value.startsWith(OpenAttendance.maybeEmoji)) {
                        const raw = value.replace(`${OpenAttendance.maybeEmoji} `, '');
                        const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                        const driver = this.tier.getDriver(id);
                        const reserve = this.tier.getReserve(id);
                        if (driver) {
                            this.tentative.set(driver.id, driver);
                        } else if (reserve) {
                            this.tentative.set(reserve.id, reserve);
                        }
                    }

                    if (value.startsWith(OpenAttendance.unknownEmoji)) {
                        const raw = value.replace(`${OpenAttendance.unknownEmoji} `, '');
                        const id = raw.replace('<@', '').replace('!', '').replace('>', '');
                        const driver = this.tier.getDriver(id);
                        const reserve = this.tier.getReserve(id);
                        if (driver) {
                            this.unknown.set(driver.id, driver);
                        } else if (reserve) {
                            this.unknown.set(reserve.id, reserve);
                        }
                    }
                });
            }
        });
    }

    isLocked() {
        return this.locked;
    }

    async setLocked(lock) {
        this.locked = lock;
        await this.edit();
        this.message.reactions.removeAll();
    }

    toString() {
        return `[Message](${this.message.url})`;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.embed.title,
            creator: this.creator ? this.creator.id : null,
            guild: this.server.id,
            channel: this.message.channel.id,
            date: this.date.toISOString(),
            accepted: this.accepted.keyArray(),
            rejected: this.rejected.keyArray(),
            tentative: this.tentative.keyArray(),
            unknown: this.unknown.keyArray(),
            tier: this.tier.name,
            locked: this.locked,
        };
    }
}

module.exports = OpenAttendance;