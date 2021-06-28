const { Client, MessageEmbed } = require("discord.js");
const AttendanceManager = require("../managers/AttendanceManager");
const formatFormalTime = require("../utils/formatFormatTime");
const formatTrack = require("../utils/formatTrack");
const { timezoneNames } = require("../utils/timezones");
const AdvancedAttendance = require("./AdvancedAttendance");
const QualiResult = require("./QualiResult");
const RaceResult = require("./RaceResult");
const Tier = require("./Tier");
const schedule = require('node-schedule');

class Race {
    /**
     * @param {Client} client
     * @param {Tier} tier 
     * @param {string} name
     * @param {Date} date 
     */
    constructor(client, tier, name, date, timezone) {
        this.client = client;
        this.tier = tier;
        this.name = name;
        this.date = date;
        this.timezone = timezone;
        this.link = undefined;
        this.attendance = undefined;
        this.attendanceChannel = undefined;
        /**
         * @type {RaceResult[]}
         */
        this.results = [];

        /**
         * @type {QualiResult[]}
         */
        this.qualifying = [];
        this.schedule = undefined;
        if (this.date) {
            this.update();
        }
    }

    load(tier, object) {
        try {
            this.tier = tier;
            this.name = object.name;
            this.date = new Date(object.date);
            this.timezone = object.timezone;
            this.link = object.link;
            if (object.attendance) {
                this.attendance = object.attendance.id;
                this.attendanceChannel = object.attendance.channel;
            }
            for (const resultObject of object.results) {
                const result = new RaceResult();
                result.load(tier, resultObject);
                this.results.push(result);
            }
            this.results.sort((a, b) => a.position - b.position);
            if (object.qualifying) {
                for (const qualiObject of object.qualifying) {
                    const result = new QualiResult();
                    result.load(tier, qualiObject);
                    this.qualifying.push(result);
                }
                this.qualifying.sort((a, b) => a.position - b.position);
            }
            this.update();
        } catch(err) {
            console.log(err);
        }
    }

    createAttendance(resolve) {
        if (this.attendance || !this.attendanceChannel) return resolve();
        const attendanceembed = new MessageEmbed();
        attendanceembed.setColor('RED');
        const dateString = `${this.date.toLocaleDateString('en-US', { timeZone: timezoneNames.get(this.timezone), weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${formatFormalTime(this.date, this.timezone)}`;
        attendanceembed.setTitle(this.name);
        attendanceembed.setDescription(`Automagically created!`);
        if (formatTrack(this.name)) {
            attendanceembed.setThumbnail(formatTrack(this.name));
        }
        attendanceembed.addFields(
            { name: "Date & Time", value: dateString, inline: false }
        );
        this.tier.teams.forEach(team => {
            const driverNames = [];
            if (team.drivers.size === 0) {
                driverNames.push('-');
            }
            team.drivers.forEach(d => {
                driverNames.push(`${AttendanceManager.unknown} ${d.member}`);
            });
            attendanceembed.addField(team.name, driverNames.join('\n'), false);
        });
        const reserveNames = [];
        if (this.tier.reserves.size !== 0) {
            this.tier.reserves.forEach(reserve => {
                reserveNames.push(`${AttendanceManager.unknown} ${reserve.member}`);
            });
            attendanceembed.addField('Reserves', reserveNames.join('\n'), false);
        }
        attendanceembed.setFooter(this.tier.name);
        attendanceembed.setTimestamp(this.date);
        attendanceembed.setColor('RED');
        const channel = this.tier.server.guild.channels.cache.get(this.attendanceChannel);
        console.log(attendanceembed);
        if (!channel.isText()) {
            return resolve();
        }
        channel.send(attendanceembed).then(async (m) => {
            await m.react(AttendanceManager.accept);
            await m.react(AttendanceManager.reject);
            await m.react(AttendanceManager.tentative);
            await m.react(AttendanceManager.delete);
            await m.react(AdvancedAttendance.editEmoji);
            await m.react(AdvancedAttendance.lockEmoji);
            const attendance = new AdvancedAttendance(this.client, m, this.tier.server, this.tier, date, this.tier.server.getAttendanceManager());
            attendance.timezone = this.timezone;
            this.tier.server.getAttendanceManager().advancedEvents.set(attendance.id, attendance);
            this.attendance = attendance.id;
            try {
                await attendance.save();
                await this.tier.server.update();
                resolve(attendance);
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                resolve(attendance);
            }
        });
    }

    update() {
        if (this.date) {
            if (this.schedule) {
                this.schedule.cancel();
            }
            if (this.date.getTime() > new Date().getTime()) {
                const scheduleDate = new Date(Math.max(this.date.getTime() - 1000 * 60 * 60 * 24 * 6), new Date().getTime());
                this.schedule = schedule.scheduleJob(this.name, scheduleDate, () => {
                    console.log(`[RACE SCHEDULE] Scheduling attendance for race ${this.name}`);
                    this.createAttendance(() => {
                        this.tier.server.log(`[RACE] Automagically scheduled attendance for ${this.name}`);
                    });
                    this.schedule.cancel();
                });
            }
        }
    }

    toJSON() {
        const results = [];
        for (const result of this.results) {
            results.push(result.toJSON());
        }
        const qualifying = [];
        for (const quali of this.qualifying) {
            qualifying.push(quali.toJSON());
        }
        return {
            name: this.name,
            tier: this.tier.name,
            date: this.date.toISOString(),
            timezone: this.timezone,
            results,
            qualifying,
            link: this.link ? this.link : null,
            attendance: {
                id: this.attendance ? this.attendance : null,
                channel: this.attendanceChannel ? this.attendanceChannel : null,
            }
        }
    }
}

module.exports = Race;