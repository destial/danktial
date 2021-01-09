const Discord = require('discord.js');
const schedule = require('node-schedule');

class Attendance {
    /**
     * 
     * @param {Discord.MessageEmbed} embed 
     * @param {string} id
     * @param {Date} date
     * @param {Discord.Guild} guild
     */
    constructor(embed, id, date, guild) {
        /**
         * @constant
         */
        this.id = id;
        this.embed = embed;
        this.title = embed.title;
        this.description = embed.description;
        this.guild = guild;
        this.date = new Date(date);
        /**
         * @type {Discord.Collection<string, string>}
         */
        this.accepted = new Discord.Collection();
        const acceptedP = embed.fields.find((emb) => emb.name.toLowerCase().includes('accept')).value.split('\n');
        acceptedP.forEach((user) => {
            const p = user.replace(">>> ", "");
            const us = guild.members.cache.find(u => u.user.username === p);
            if (us) {
                this.accepted.set(us.id, us.user.username);
            }
        });
         /**
         * @type {Discord.Collection<string, string>}
         */
        this.rejected = new Discord.Collection();
        const rejectedP = embed.fields.find((emb) => emb.name.toLowerCase().includes('reject')).value.split('\n');
        rejectedP.forEach((user) => {
            const p = user.replace(">>> ", "");
            const us = guild.members.cache.find(u => u.user.username === p);
            if (us) {
                this.rejected.set(us.id, us.user.username);
            }
        });
         /**
         * @type {Discord.Collection<string, string>}
         */
        this.tentative = new Discord.Collection();
        const tentativeP = embed.fields.find((emb) => emb.name.toLowerCase().includes('tentative')).value.split('\n');
        tentativeP.forEach((user) => {
            const p = user.replace(">>> ", "");
            const us = guild.members.cache.find(u => u.user.username === p);
            if (us) {
                this.tentative.set(us.id, us.user.username);
            }
        });
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

        this.updateList();
    }

    static get accept() { return "✅"; }
    static get reject() { return "❌"; }
    static get tentative() { return "❔"; }

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
        this.schedule = schedule.scheduleJob(this.title, date.getTime()-300000, () => {
            /**
             * @type {string[]}
             */
            const participants = [];
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
        return this.embed.spliceFields(0, 1, {
            name: "Date & Time", value: (dateString), inline: false
        });
    }
}

module.exports = Attendance;