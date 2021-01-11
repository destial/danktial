const Discord = require('discord.js');
const AttendanceManager = require('../managers/AttendanceManager');
const Server = require('./Server');
const Tier = require('./Tier');
const Driver = require('./Driver');
const Database = require('../database/Database');
const schedule = require('node-schedule');

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

        const fiveMinBefore = this.date.getTime() - 300000;
        if (fiveMinBefore > new Date().getTime()) {
            this.schedule = schedule.scheduleJob(this.title, fiveMinBefore, () => {
                const participants = [""];
                participants.shift();
                this.accepted.keyArray().forEach(k => {
                    participants.push(k);
                });
                participants.forEach(async (participant) => {
                    const mem = this.guild.members.cache.find((member) => member.id === participant);
                    if (mem) {
                        const embed = new Discord.MessageEmbed();
                        embed.setAuthor(`You have an event scheduled in 5 minutes!`);
                        embed.setDescription(this.title);
                        mem.user.send(embed);
                    }
                });
                this.schedule.cancel();
            });
        }

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

        this.embed.fields.forEach(field => {
            if (field.value.startsWith(AdvancedAttendance.rejectEmoji)) {
                const name = field.value.replace(`${AdvancedAttendance.rejectEmoji} `, '');
                const member = this.server.guild.members.cache.find(m => m.user.username === name.trim());
                if (member) {
                    const driver = this.tier.getDriver(member.id);
                    if (driver) {
                        this.rejected.set(driver.id, driver);
                    }
                }
            }

            if (field.value.startsWith(AdvancedAttendance.acceptEmoji)) {
                const name = field.value.replace(`${AdvancedAttendance.acceptEmoji} `, '');
                const member = this.server.guild.members.cache.find(m => m.user.username === name.trim());
                if (member) {
                    const driver = this.tier.getDriver(member.id);
                    if (driver) {
                        this.accepted.set(driver.id, driver);
                    }
                }
            }

            if (field.value.startsWith(AdvancedAttendance.maybeEmoji)) {
                const name = field.value.replace(`'${AdvancedAttendance.maybeEmoji} `, '');
                const member = this.server.guild.members.cache.find(m => m.user.username === name.trim());
                if (member) {
                    const driver = this.tier.getDriver(member.id);
                    if (driver) {
                        this.tentative.set(driver.id, driver);
                    }
                }
            }
        });
    }

    static get acceptEmoji() { return "🟢"; }
    static get rejectEmoji() { return "🔴"; }
    static get maybeEmoji() { return "🔵"; }

    /**
     * 
     * @param {Driver} driver 
     */
    async accept(driver) {
        if (!this.accepted.get(driver.id)) {
            const field = this.embed.fields.find(field => field.value.includes(driver.name));
            const value = field.value;
            const index = value.indexOf(driver.name);
            const firstHalf = value.substring(0, index-3);
            const secondHalf = value.substring(index-1);
            field.value = firstHalf + AdvancedAttendance.acceptEmoji + secondHalf;
            this.accepted.set(driver.id, driver);
            this.rejected.delete(driver.id);
            this.tentative.delete(driver.id);
            await this.message.edit(this.embed);
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    async reject(driver) {
        if (!this.rejected.get(driver.id)) {
            const field = this.embed.fields.find(field => field.value.includes(driver.name));
            const value = field.value;
            const index = value.indexOf(driver.name);
            const firstHalf = value.substring(0, index-3);
            const secondHalf = value.substring(index-1);
            field.value = firstHalf + AdvancedAttendance.rejectEmoji + secondHalf;
            this.rejected.set(driver.id, driver);
            this.accepted.delete(driver.id);
            this.tentative.delete(driver.id);
            await this.message.edit(this.embed);
        }
    }

    /**
     * 
     * @param {Driver} driver 
     */
    async maybe(driver) {
        if (!this.tentative.get(driver.id)) {
            const field = this.embed.fields.find(field => field.value.includes(driver.name));
            const value = field.value;
            const index = value.indexOf(driver.name);
            const firstHalf = value.substring(0, index-3);
            const secondHalf = value.substring(index-1);
            field.value = firstHalf + AdvancedAttendance.maybeEmoji + secondHalf;
            this.tentative.set(driver.id, driver);
            this.rejected.delete(driver.id);
            this.accepted.delete(driver.id);
            await this.message.edit(this.embed);
        }
    }

    async reset() {
        const promise = new Promise((resolve,reject) => {
            this.embed.spliceFields(1, this.embed.fields.length-1);
            this.tier.teams.forEach(team => {
                var driverList = '';
                team.drivers.forEach(driver => {
                    driverList += `${AdvancedAttendance.rejectEmoji} ${driver.name}\n`;
                });
                this.embed.addField(team.name, driverList, false);
            });
            if (this.tier.reserves.size !== 0) {
                var reserveList = '';
                this.tier.reserves.forEach(reserve => {
                    reserveList += `${AdvancedAttendance.rejectEmoji} ${reserve.name}\n`;
                });
                this.embed.addField('Reserves', reserveList, false);
            }
            resolve();
        });

        promise.then(() => {
            console.log(`[ADATTENDANCE] Reset attendance ${this.embed.title}`);
            this.message.edit(this.embed);
        });
    }

    async update() {
        await Database.run(Database.advancedAttendanceSaveQuery, [this.id, String(this.date.getTime()), this.message.channel.id, this.tier.name]);
        console.log(`[ADATTENDANCE] Updated attendance ${this.embed.title} from ${this.server.guild.name}`);
    }

    async delete() {
        await Database.run(Database.advancedAttendanceDeleteQuery, [this.id]);
        console.log(`[ADATTENDANCE] Deleted attendance ${this.embed.title} from ${this.server.guild.name}`);
    }

    async save() {
        await Database.run(Database.advancedAttendanceSaveQuery, [this.id, String(this.date.getTime()), this.message.channel.id, this.tier.name]);
        console.log(`[ADATTENDANCE] Saved attendance ${this.embed.title} from ${this.server.guild.name}`);
    }
}

module.exports = AdvancedAttendance;