const Discord = require('discord.js');
const Server = require('../items/Server');
const Database = require("../database/Database");
const QueueWorker = require('../database/QueueWorker');
const Query = require('../database/Query');

class ServerManager {
    /**
     * 
     * @param {Discord.Client} client 
     */
    constructor(client) {
        /**
         * @type {Discord.Collection<string, Server>}
         */
        this.servers = new Discord.Collection();
        this.queueWorker = new QueueWorker(this);
        this.client = client;

        setInterval(() => {
            this.servers.forEach(server => {
                server.backup();
            });
        }, 1000 * 60 * 60 * 3);
    }

    /**
     * 
     * @param {Server} server
     */
    async addServer(server) {
        return new Promise(async (resolve, reject)  => {
            const s = await this.fetch(server.id);
            if (!s) {
                this.servers.set(server.id, server);
                console.log(`[SERVER] Added server ${server.guild.name} of id ${server.id}`);
                resolve(server);
            } else {
                reject();
            }
        });
    }

    /**
     * 
     * @param {Server} server 
     */
    async removeServer(server) {
        const deleted = this.servers.delete(server.id);
        if (deleted) {
            await Database.runNewDB('DELETE FROM servers WHERE id=(?)', [this.id]);
            console.log(`[DELETED SERVER] Deleted server ${server.guild.name}`);
        }
    }

    /**
     * 
     * @param {string} id 
     * @returns {Promise<Server>}
     */
    fetch(id) {
        return new Promise((resolve, reject) => {
            const server = this.servers.get(id);
            resolve(server);
        });
    }
}

module.exports = ServerManager;