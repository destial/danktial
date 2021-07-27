const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');
const { Logger } = require('../utils/Utils');

class CountManager {
    /**
     * @param {Discord.Client} client
     * @param {Server} server 
     */
    constructor(client, server) {
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
        this.client = client;
    }

    /**
     * 
     * @param {"member" | "channel" | "role"} name 
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
     * @param {"member" | "channel" | "role"} name 
     * @param {Discord.GuildChannel} channel 
     */
    setCount(name, channel) {
        return new Promise(async (resolve, reject) => {
            if (!channel) {
                return resolve(undefined);
            }
            switch (name.toLowerCase()) {
                case "member":
                    this.membercount = channel;
                    Database.run(Database.countSaveQuery, [channel.id, "membercount"]);
                    Logger.info(`[COUNT] Created membercount channel ${channel.id}`);
                    resolve(this.membercount);
                    break;
                case "channel":
                    this.channelcount = channel;
                    Database.run(Database.countSaveQuery, [channel.id, "channelcount"]);
                    Logger.info(`[COUNT] Created channelcount channel ${channel.id}`);
                    resolve(this.channelcount);
                    break;
                case "role":
                    this.rolecount = channel;
                    Database.run(Database.countSaveQuery, [channel.id, "rolecount"]);
                    Logger.info(`[COUNT] Created rolecount channel ${channel.id}`);
                    resolve(this.rolecount);
                    break;
                default:
                    resolve(undefined);
                    break;
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
                        Database.run(Database.countDeleteQuery, [this.membercount.id]);
                        Logger.warn(`[COUNT] Deleted membercount channel ${this.membercount.id}`);
                    }
                    resolve(this.membercount);
                    break;
                case "channel":
                    if (this.channelcount) {
                        Database.run(Database.countDeleteQuery, [this.channelcount.id]);
                        Logger.warn(`[COUNT] Deleted channelcount channel ${this.channelcount.id}`);
                    }
                    resolve(this.channelcount);
                    break;
                case "role":
                    if (this.rolecount) {
                        Database.run(Database.countDeleteQuery, [this.rolecount.id]);
                        Logger.warn(`[COUNT] Deleted rolecount channel ${this.rolecount.id}`);
                    }
                    resolve(this.rolecount);
                    break;
                default:
                    resolve(undefined);
                    break;
            }
        });
    }
}

module.exports = CountManager;