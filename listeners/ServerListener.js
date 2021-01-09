const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('guildCreate', async (guild) => {
            try {
                const exists = await servers.fetch(guild.id);
                if (!exists) {
                    const server = new Server(client, guild, undefined, "-", 0, servers);
                    servers.addServer(server);
                    server.save();
                    console.log(`[SERVER] Joined server ${guild.id}`);
                }
            } catch (err) {
                console.log('[ERROR] Something happened while trying to add a server!', err);
            }
        });

        client.on('guildDelete', async (guild) => {
            try {
                await servers.removeServer(guild.id);
                console.log(`[SERVER] Left server ${guild.id}`);
            } catch (err) {
                console.log('[ERROR] Something happened while trying to add a server!', err);
            }
        });
    }
};