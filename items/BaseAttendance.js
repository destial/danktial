const Server = require("./Server");
const Discord = require('discord.js');

class BaseAttendance {

    /**
     * 
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {Discord.Message} message 
     * @param {Date} date 
     */
    constructor(client, server, message, date) {
        this.client = client;
        this.server = server;
        this.message = message;
        this.embed = this.message.embeds[0];
        this.title = this.embed.title;
        this.date = date;
        this.next = undefined;
        this.type = '';
        this.attendanceType = '';
        this.timezone = '';

        /**
         * @type {Discord.GuildMember}
         */
        this.creator = undefined;
    } 

    /**
     * 
     * @param {'weekly' | 'daily' | 'monthly' | 'fortnightly'} type 
     * @param {string} title
     * @param {string} description
     */
    async newSchedule(type, title, description) {
        this.type = type.toLowerCase();
        const newSchedule = new Date(this.date.getTime());
        switch (this.type) {
            case 'daily': {
                this.next = {
                    date: newSchedule.setDate(newSchedule.getDate() + 1),
                    title: title ? title : this.title,
                    description: description ? description: this.embed.description,
                }
                break;
            }
            case 'monthly': {
                this.next = {
                    date: newSchedule.setMonth(newSchedule.getMonth() + 1),
                    title: title ? title : this.title,
                    description: description ? description: this.embed.description,
                }
                break;
            }
            case 'fortnightly': {
                this.next = {
                    date: newSchedule.setDate(newSchedule.getDate() + 14),
                    title: title ? title : this.title,
                    description: description ? description: this.embed.description,
                }
                break;
            }
            default: {
                this.next = {
                    date: newSchedule.setDate(newSchedule.getDate() + 7),
                    title: title ? title : this.title,
                    description: description ? description: this.embed.description,
                }
                break;
            }
        }
        return this.next;
    }
}

module.exports = BaseAttendance;