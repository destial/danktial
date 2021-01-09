const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');

class CountManager {
    /**
     * 
     * @param {Server} server 
     */
    constructor(server) {
        /**
         * @type {Discord.GuildChannel} 
         */
        this.membercount = undefined;

        /**
         * @type {Discord.GuildChannel} 
         */
        this.channelcount = undefined;

        /**
         * @type {Discord.GuildChannel} 
         */
        this.rolecount = undefined;

        this.server = server;
    }

    /**
     * 
     * @param {string} name 
     */
    getCount(name) {
        switch (name.toLowerCase()) {
            case "member":
                return this.membercount;
            case "channel":
                return this.channelcount;
            case "role":
                return this.rolecount;
            default:
                return undefined;
        }
    }

    /**
     * 
     * @param {string} name 
     * @param {Discord.GuildChannel} channel 
     */
    setCount(name, channel) {
        return new Promise(async (resolve, reject) => {
            switch (name.toLowerCase()) {
                case "member":
                    this.membercount = channel;
                    await Database.run(Database.countSaveQuery, [channel.id, "membercount"]);
                    resolve(this.membercount);
                    break;
                case "channel":
                    this.channelcount = channel;
                    await Database.run(Database.countSaveQuery, [channel.id, "channelcount"]);
                    resolve(this.channelcount);
                    break;
                case "role":
                    this.rolecount = channel;
                    await Database.run(Database.countSaveQuery, [channel.id, "rolecount"]);
                    resolve(this.rolecount);
                    break;
                default:
                    resolve(undefined);
            }
        });
    }

    /**
     * 
     * @param {string} name 
     * @param {Discord.GuildChannel} channel 
     */
    deleteCount(name) {
        return new Promise(async (resolve, reject) => {
            switch (name.toLowerCase()) {
                case "member":
                    if (this.membercount) {
                        await Database.run(Database.countDeleteQuery, [this.membercount.id]);
                    }
                    resolve(this.membercount);
                    break;
                case "channel":
                    if (this.channelcount) {
                        await Database.run(Database.countDeleteQuery, [this.channelcount.id]);
                    }
                    resolve(this.channelcount);
                    break;
                case "role":
                    if (this.rolecount) {
                        await Database.run(Database.countDeleteQuery, [this.rolecount.id]);
                    }
                    resolve(this.rolecount);
                    break;
                default:
                    resolve(undefined);
            }
        });
    }
}

module.exports = CountManager;