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
                    const guildMember = guild.member(client.user);
                    if (!guildMember.hasPermission('ADMINISTRATOR') || !guildMember.hasPermission('MANAGE_GUILD')) {
                        const embed = new Discord.MessageEmbed();
                        embed.setColor('RED');
                        embed.setAuthor('I do not have enough permissions to function normally! Please allow me to manage the server and/or set me as administrator!');
                        await guild.systemChannel.send(embed);
                    }
                    const server = new Server(client, guild, undefined, '-', 0, servers);
                    servers.addServer(server);
                    await server.save();
                    console.log(`[SERVER] Joined server ${guild.name}`);
                    await client.user.setActivity(`${servers.servers.size} leagues`, { type: 'COMPETING' });
                }
            } catch (err) {
                console.log('[ERROR] Something happened while trying to add a server!', err);
            }
        });

        client.on('guildDelete', async (guild) => {
            try {
                const server = await servers.fetch(guild.id);
                await servers.removeServer(server);
                console.log(`[SERVER] Left server ${guild.name}`);
                await client.user.setActivity(`${servers.servers.size} leagues`, { type: 'COMPETING' });
            } catch (err) {
                console.log('[ERROR] Something happened while trying to remove a server!', err);
            }
        });
    }
};