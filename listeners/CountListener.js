const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const TicketManager = require('../managers/TicketManager');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('channelDelete', async (channel) => {
            if (channel.partial) {
                try {
                    channel = await channel.fetch();
                } catch (err) {
                    console.log("[ERROR] Something wrong while fetching uncached channels!", err);
                }
            }
            if (!channel.guild) return;
            const server = await servers.fetch(channel.guild.id);
            if (server) {
                if (server.getCountManager().getCount('channel')) {
                    if (channel.id === server.getCountManager().getCount('channel').id) {
                        await server.getCountManager().deleteCount('channel');
                        console.log(`[COUNT] Deleted channelcount channel ${channel.id}`);
                    } else if (channel.id === server.getCountManager().getCount('member').id) {
                        await server.getCountManager().deleteCount('member');
                        console.log(`[COUNT] Deleted membercount channel ${channel.id}`);
                    } else if (channel.id === server.getCountManager().getCount('role').id) {
                        await server.getCountManager().deleteCount('role');
                        console.log(`[COUNT] Deleted rolecount channel ${channel.id}`);
                    }

                    if (server.getCountManager().getCount('channel')) {
                        await server.getCountManager().getCount('channel').edit({
                            name: `Channel Count: ${server.guild.channels.cache.size}`
                        });
                        await server.log(`Created a channel!`, `${channel}`);
                    }
                }
            }
        });

        client.on('channelCreate', async (channel) => {
            if (channel.partial) {
                try {
                    channel = await channel.fetch();
                } catch (err) {
                    console.log('[ERROR] Something wrong while fetching uncached channels!', err);
                }
            }
            if (!channel.guild) return;
            const server = await servers.fetch(channel.guild.id);
            if (server) {
                if (server.getCountManager().getCount('channel')) {
                    await server.getCountManager().getCount('channel').edit({
                        name: `Channel Count: ${server.guild.channels.cache.size}`
                    });
                    await server.log('Created a channel!', `${channel}`);
                }
            }
        });

        client.on('roleCreate', async (role) => {
            const server = await servers.fetch(role.guild.id);
            if (server) {
                if (server.getCountManager().getCount('role')) {
                    await server.getCountManager().getCount('role').edit({
                        name: `Role Count: ${server.guild.roles.cache.size}`
                    });
                    await server.log('Created a role!', `${role}`);
                }
            }
        });

        client.on('roleDelete', async (role) => {
            const server = await servers.fetch(role.guild.id);
            if (server) {
                if (server.getCountManager().getCount('role')) {
                    await server.getCountManager().getCount('role').edit({
                        name: `Role Count: ${server.guild.roles.cache.size}`
                    });
                    await server.log('Deleted a role!', `${role}`);
                }
            }
        });

        client.on('guildMemberAdd', async (member) => {
            const server = await servers.fetch(member.guild.id);
            if (server) {
                if (server.getCountManager().getCount('member')) {
                    await server.getCountManager().getCount('member').edit({
                        name: `Member Count: ${server.guild.roles.cache.size}`
                    });
                    await server.log('Member joined!', `${member}`);
                }
            }
        });

        client.on('guildMemberRemove', async (member) => {
            const server = await servers.fetch(member.guild.id);
            if (server) {
                if (server.getCountManager().getCount('member')) {
                    await server.getCountManager().getCount('member').edit({
                        name: `Member Count: ${server.guild.roles.cache.size}`
                    });
                    await server.log('Member left!', `${member}`);
                }
            }
        });
    }
};