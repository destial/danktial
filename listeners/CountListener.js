const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const formatAccountAge = require('../utils/formatAccountAge');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        try {
            client.on('channelDelete', async (channel) => {
                if (!channel.guild) return;
                const server = await servers.fetch(channel.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('channel') && channel.id === server.getCountManager().getCount('channel').id) {
                        await server.getCountManager().deleteCount('channel');

                    } else if (channel.id === server.getCountManager().getCount('member') && channel.id === server.getCountManager().getCount('member').id) {
                        await server.getCountManager().deleteCount('member');

                    } else if (channel.id === server.getCountManager().getCount('role') && channel.id === server.getCountManager().getCount('role').id) {
                        await server.getCountManager().deleteCount('role');
                    }

                    if (server.getCountManager().getCount('channel')) {
                        if (server.getCountManager().getCount('channel')) {
                            await server.getCountManager().getCount('channel').edit({
                                name: `Channel Count: ${server.guild.channels.cache.size}`
                            });
                        }
                    }
                    server.log(`Channel deleted!`, `#${channel.name}`);
                }
            });

            client.on('channelCreate', async (channel) => {
                if (!channel.guild) return;
                const server = await servers.fetch(channel.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('channel')) {
                        await server.getCountManager().getCount('channel').edit({
                            name: `Channel Count: ${server.guild.channels.cache.size}`
                        });
                    }
                    await server.log('Channel created!', `${channel} - #${channel.name}`);
                }
            });

            client.on('roleCreate', async (role) => {
                const server = await servers.fetch(role.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('role')) {
                        await server.getCountManager().getCount('role').edit({
                            name: `Role Count: ${server.guild.roles.cache.size}`
                        });
                    }
                    await server.log('Role created!', `${role} - @${role.name}`);
                }
            });

            client.on('roleDelete', async (role) => {
                const server = await servers.fetch(role.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('role')) {
                        await server.getCountManager().getCount('role').edit({
                            name: `Role Count: ${server.guild.roles.cache.size}`
                        });
                    }
                    await server.log('Role deleted!', `@${role.name}`);
                }
            });

            client.on('guildMemberAdd', async (member) => {
                const server = await servers.fetch(member.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('member')) {
                        await server.getCountManager().getCount('member').edit({
                            name: `Member Count: ${server.guild.memberCount}`
                        });
                    }
                    await server.log(`Member joined!`, `${member} - ${member.user.tag}`, (member.user.createdAt ? [{ name: `Account Age`, value: `${formatAccountAge(member.user.createdAt)} old`, inline: false}] : undefined));
                    if (server.joinEmbed)
                        member.user.send(server.joinEmbed);
                }
            });

            client.on('guildMemberRemove', async (member) => {
                const server = await servers.fetch(member.guild.id);
                if (server) {
                    if (server.getCountManager().getCount('member')) {
                        await server.getCountManager().getCount('member').edit({
                            name: `Member Count: ${server.guild.memberCount}`
                        });
                    }
                    await server.log('Member left!', `${member.user.tag}`, (member.joinedAt ? [{ name: `Joined Since`, value: `${formatAccountAge(member.joinedAt)} ago`, inline: false}] : undefined));
                }
            });
        } catch(err) {
            console.log(err);
        }
    }
};