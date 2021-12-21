const QualiResult = require("./QualiResult");
const RaceResult = require("./RaceResult");
const schedule = require('node-schedule');
const { Logger } = require("../utils/Utils");

class Race {
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

    createAttendance() {
        if (!this.attendanceChannel || this.attendance) return;
        const channel = this.tier.server.guild.channels.cache.get(this.attendanceChannel);
        if (!channel || !channel.isText()) return;
        this.tier.server.getAttendanceManager().createAdvanced(this.name, `Reminder to check in for this event!`, this.date, this.timezone, this.tier, channel, (attendance) => {
            if (attendance) {
                this.attendance = attendance.id;
                Logger.log(`[RACE SCHEDULE] Created attendance for ${this.name}`);
                this.tier.server.log(`[RACE SCHEDULE] Scheduled attendance for ${this.name}`);
                this.tier.server.save();
            }
        });
    }

    update() {
        if (this.date) {
            if (this.schedule) {
                this.schedule.cancel();
            }
            const today = new Date();
            if (this.date.getTime() > today.getTime()) {
                const days6 = new Date(this.date);
                days6.setTime(this.date.getTime() - (1000 * 60 * 60 * 24 * 6));
                if (days6.getTime() > today.getTime()) {
                    this.schedule = schedule.scheduleJob(days6, () => {
                        Logger.log(`[RACE SCHEDULE] Scheduling attendance for event ${this.name}`);
                        this.createAttendance();
                        this.schedule.cancel();
                    });
                    return;
                }
                this.schedule = null;
                this.createAttendance();
            }
        }
    }

    updateDate(date, tz) {
        if (date) {
            if (this.schedule) {
                this.schedule.cancel();
            }
            this.date = date;
            if (this.attendance) {
                const attendance = this.tier.server.getAttendanceManager().fetchAdvanced(this.attendance);
                if (attendance) {
                    var time = `${date.getTime()}`.substring(0, 10);
                    time = `<t:${time}:F>`
                    attendance.updateDate(date, time);
                }
            } else {
                const today = new Date();
                if (this.date.getTime() > today.getTime()) {
                    const days6 = new Date(this.date);
                    days6.setTime(this.date.getTime() - (1000 * 60 * 60 * 24 * 6));
                    if (days6.getTime() > today.getTime()) {
                        this.schedule = schedule.scheduleJob(days6, () => {
                            Logger.log(`[RACE SCHEDULE] Scheduling attendance for race ${this.name}`);
                            this.createAttendance();
                            this.schedule.cancel();
                        });
                        return;
                    }
                    this.schedule = null;
                    this.createAttendance();
                }
            }
        }
    }

    updateName(name) {
        if (this.attendance) {
            const attendance = this.tier.server.getAttendanceManager().fetchAdvanced(this.attendance);
            attendance.embed.setTitle(name);
            attendance.edit();
        }
        this.name = name;
        this.tier.server.update();
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