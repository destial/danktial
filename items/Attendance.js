const Discord = require('discord.js');
const schedule = require('node-schedule');
const Database = require('../database/Database');
const Server = require('./Server');

class Attendance {
    /**
     * 
     * @param {Discord.MessageEmbed} embed 
     * @param {string} id
     * @param {Date} date
     * @param {Server} server
     * @param {Discord.Message} message
     * @param {Discord.Client} client
     */
    constructor(embed, id, date, server, message, client) {
        /**
         * @constant
         */
        this.message = message;
        /**
         * @constant
         */
        this.id = id;
        this.client = client;
        this.embed = embed;
        if (embed) {
            this.title = embed.title;
            this.description = embed.description;
        }
        this.server = server;
        this.guild = this.server.guild;
        this.date = new Date(date);
        /**
         * @type {Discord.Collection<string, string>}
         */
        this.accepted = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, string>}
         */
        this.rejected = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, string>}
         */
        this.tentative = new Discord.Collection();
        if (embed) {
            const acceptedP = embed.fields.find((emb) => emb.name.toLowerCase().includes('accept')).value.split('\n');
            acceptedP.forEach((user) => {
                const p = user.replace(">>> ", "");
                const us = this.guild.members.cache.find(u => u.user.username === p);
                if (us) {
                    this.accepted.set(us.id, us.user.username);
                }
            });
            const rejectedP = embed.fields.find((emb) => emb.name.toLowerCase().includes('reject')).value.split('\n');
            rejectedP.forEach((user) => {
                const p = user.replace(">>> ", "");
                const us = this.guild.members.cache.find(u => u.user.username === p);
                if (us) {
                    this.rejected.set(us.id, us.user.username);
                }
            });
            const tentativeP = embed.fields.find((emb) => emb.name.toLowerCase().includes('tentative')).value.split('\n');
            tentativeP.forEach((user) => {
                const p = user.replace(">>> ", "");
                const us = this.guild.members.cache.find(u => u.user.username === p);
                if (us) {
                    this.tentative.set(us.id, us.user.username);
                }
            });
            this.updateList();
        }
        const fiveMinBefore = this.date.getTime() - 600000;
        if (fiveMinBefore > new Date().getTime()) {
            this.schedule = schedule.scheduleJob('attendance', fiveMinBefore, () => {
                this.accepted.forEach((nil, participant) => {
                    const mem = this.guild.members.cache.find((member) => member.id === participant);
                    if (mem) {
                        const embed = new Discord.MessageEmbed();
                        embed.setAuthor(`You have an event scheduled in 10 minutes!`);
                        embed.setColor('RED');
                        embed.setDescription(this.title);
                        mem.user.send(embed);
                    }
                });
                this.schedule.cancel();
            });
            console.log(`[ATTENDANCE] Created schedule for ${this.schedule.name}`);
        }
    }

    static get accept() { return "✅"; }
    static get reject() { return "❌"; }
    static get tentative() { return "❔"; }
    static get delete() { return "🗑️"; }

    async delete() {
        await Database.run(Database.attendanceDeleteQuery, [this.id]);
        await this.server.update();
        console.log(`[ATTENDANCE] Deleted attendance ${this.title} from ${this.guild.name}`);
    }

    async save() {
        await Database.run(Database.attendanceSaveQuery, [this.id, String(this.date.getTime()), this.message.channel.id]);
        await this.server.update();
        console.log(`[ATTENDANCE] Saved attendance ${this.title} from ${this.guild.name}`);
    }

    /**
     * 
     * @param {Discord.User} user 
     */
    accept(user) {
        if (!this.accepted.get(user.id)) {
            this.accepted.set(user.id, user.username);
            this.rejected.delete(user.id);
            this.tentative.delete(user.id);
        } else {
            this.accepted.delete(user.id);
        }
        return this.updateList();
    }

    /** 
     * 
     * @param {Discord.User} user 
     */
    reject(user) {
        if (!this.rejected.get(user.id)) {
            this.accepted.delete(user.id);
            this.rejected.set(user.id, user.username);
            this.tentative.delete(user.id);
        } else {
            this.rejected.delete(user.id);
        }
        return this.updateList();
    }

    /** 
     * 
     * @param {Discord.User} user 
     */
    maybe(user) {
        if (!this.tentative.get(user.id)) {
            this.accepted.delete(user.id);
            this.rejected.delete(user.id);
            this.tentative.set(user.id, user.username);
        } else {
            this.tentative.delete(user.id);
        }
        return this.updateList();
    }

    /**
     * @private
     */
    updateList() {
        const acceptedNames = ["-"];
        this.accepted.forEach(username => {
            acceptedNames.push(username);
        });
        if (acceptedNames.length > 1) {
            acceptedNames.shift();
        }

        const rejectedNames = ["-"];
        this.rejected.forEach(username => {
            rejectedNames.push(username);
        });
        if (rejectedNames.length > 1) {
            rejectedNames.shift();
        }

        const tentativeNames = ["-"];
        this.tentative.forEach(username => {
            tentativeNames.push(username);
        });
        if (tentativeNames.length > 1) {
            tentativeNames.shift();
        }

        const fields = [
            {
                name: `${Attendance.accept} Accepted (${(acceptedNames[0] === "-" ? 0 : acceptedNames.length)})`,
                value: `>>> ${acceptedNames.join('\n')}`,
                inline: true
            },
            {
                name: `${Attendance.reject} Rejected (${(rejectedNames[0] === "-" ? 0 : rejectedNames.length)})`,
                value: `>>> ${rejectedNames.join('\n')}`,
                inline: true
            },
            {
                name: `${Attendance.tentative} Tentative (${(tentativeNames[0] === "-" ? 0 : tentativeNames.length)})`,
                value: `>>> ${tentativeNames.join('\n')}`,
                inline: true
            }
        ];
        return this.embed.spliceFields(1, 3, fields);
    }

    /**
     * 
     * @param {Date} date 
     * @param {string} dateString 
     */
    updateDate(date, dateString) {
        this.date = date;
        this.embed.setTimestamp(date);
        this.schedule.cancel();
        this.schedule = schedule.scheduleJob(this.title, date.getTime()-600000, () => {
            this.accepted.forEach((nil, participant) => {
                const mem = this.guild.members.cache.find((member) => member.id === participant);
                if (mem) {
                    const embed = new Discord.MessageEmbed();
                    embed.setAuthor(`You have an event scheduled in 10 minutes!`);
                    embed.setColor('RED');
                    embed.setDescription(this.title);
                    mem.user.send(embed);
                }
            });
            this.schedule.cancel();
        });
        console.log(`[ATTENDANCE] Edited schedule for ${this.schedule.name}`);
        return this.embed.spliceFields(0, 1, {
            name: "Date & Time", value: (dateString), inline: false
        });
    }

    async edit() {
        await this.message.edit(this.embed);
    }

    async loadJSON(object) {
        try {
            this.guild = await this.client.guilds.fetch(object.guild);
            this.server = await this.client.manager.fetch(object.guild);
        } catch(err) {
            console.log(`[ATTENDANCE] Missing guild ${object.guild}`);
        }
        if (this.guild) {
            const channel = this.guild.channels.cache.get(object.channel);
            if (channel && channel.isText()) {
                try {
                    this.message = await channel.messages.fetch(object.id);
                } catch(err) {
                    console.log(`[ATTENDANCE] Missing attendance id ${object.id} from ${object.guild}`);
                    this.message = undefined;
                }
                if (this.message) {
                    this.id = this.message.id;
                    this.embed = this.message.embeds[0];
                    this.title = this.embed.title;
                    this.description = this.embed.description;
                    this.date = new Date(object.date);
                    this.accepted.clear();
                    this.rejected.clear();
                    this.tentative.clear();

                    object.accepted.forEach(async id => {
                        try {
                            const member = await this.guild.members.fetch(id);
                            if (member) {
                                this.accepted.set(member.id, member.user.username);
                            }
                        } catch(err) {
                            console.log(`[ATTENDANCE] Missing member ${id}`);
                        }
                    });

                    object.rejected.forEach(async id => {
                        try {
                            const member = await this.guild.members.fetch(id);
                            if (member) {
                                this.rejected.set(member.id, member.user.username);
                            }
                        } catch(err) {
                            console.log(`[ATTENDANCE] Missing member ${id}`);
                        }
                    });

                    object.tentative.forEach(async id => {
                        try {
                            const member = await this.guild.members.fetch(id);
                            if (member) {
                                this.tentative.set(member.id, member.user.username);
                            }
                        } catch(err) {
                            console.log(`[ATTENDANCE] Missing member ${id}`);
                        }
                    });
                    this.server.getAttendanceManager().getEvents().set(this.id, this);

                    if (this.schedule) {
                        this.schedule.cancel();
                    }
                    const fiveMinBefore = this.date.getTime() - 600000;
                    this.schedule = schedule.scheduleJob(this.title, new Date(fiveMinBefore), () => {
                        this.accepted.forEach((nil, participant) => {
                            const mem = this.guild.members.cache.find((member) => member.id === participant);
                            if (mem) {
                                const embed = new Discord.MessageEmbed();
                                embed.setAuthor(`You have an event scheduled in 10 minutes!`);
                                embed.setColor('RED');
                                embed.setDescription(this.title);
                                mem.user.send(embed);
                            }
                        });
                        this.schedule.cancel();
                    });
                    console.log(`[ATTENDANCE] Loaded ${this.embed.title} from ${this.guild.name}`);
                }
            }
        }
    }

    toString() {
        return `[Message](${this.message.url})`;
    }

    toJSON() {
        return {
            id: this.id,
            guild: this.guild.id,
            channel: this.message.channel.id,
            date: this.date.toISOString(),
            accepted: this.accepted.keyArray(),
            rejected: this.rejected.keyArray(),
            tentative: this.tentative.keyArray()
        };
    }
}

module.exports = Attendance;