const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'newcount',
    aliases: ['count', 'setcount'],
    usage: '[ member | channel | role | all ]',
    description: 'Creates count channels',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        const promise = new Promise(async (resolve, reject) => {
            var category = server.guild.channels.cache.find((c) => c.name.toLowerCase().includes('count') && c.type === 'category');
            if (args[0] === 'member' || args[0] === 'channel' || args[0] === 'role' || args[0] === 'all') {
                if (!category) {
                    try {
                        category = await server.guild.channels.create('count', {
                            type: 'category',
                            permissionOverwrites: [
                                {
                                    id: server.guild.roles.everyone.id,
                                    deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                }
                            ]
                        });
                    } catch (err) {
                        console.log('[ERROR] Something happened while trying to create count channel category!', err);
                        reject();
                        return;
                    }
                }
                try {
                    if (args[0] === "all") {
                        if (!server.getCountManager().getCount('member') && !server.getCountManager().getCount('channel') && !server.getCountManager().getCount('role')) {
                            const membercount = await server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('member', membercount);
                            server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);

                            const channelcount = await server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('channel', channelcount);
                            server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);

                            const rolecount = await server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('role', rolecount);
                            server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);

                            const embed = new Discord.MessageEmbed()
                                .setAuthor('Created All Counts!');
                            await message.channel.send(embed);
                        }
                    } else if (args[0] === 'member') {
                        if (!server.getCountManager().getCount('member')) {
                            const membercount = await server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('member', membercount);
                            const embed = new Discord.MessageEmbed()
                                .setAuthor('Created Member Count!');
                            await message.channel.send(embed);
                            server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);
                        }
                    } else if (args[0] === 'role') {
                        if (!server.getCountManager().getCount('role')) {
                            const rolecount = await server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('role', rolecount);
                            const embed = new Discord.MessageEmbed()
                                .setAuthor('Created Role Count!');
                            await message.channel.send(embed);
                            server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);
                        }
                    } else if (args[0] === 'channel') {
                        if (!server.getCountManager().getCount('channel')) {
                            const channelcount = await server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            });
                            await server.getCountManager().setCount('channel', channelcount);
                            const embed = new Discord.MessageEmbed()
                                .setAuthor('Created Channel Count!');
                            await message.channel.send(embed);
                            server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);
                        }
                    }
                    resolve(server.getCountManager());
                } catch (err) {
                    console.log('[ERROR] Something happened while trying to create count channels!', err);
                    reject();
                }
            } else {
                const embed = new Discord.MessageEmbed()
                    .setAuthor('Usage is:')
                    .setDescription(`${server.prefix}${this.name} ${this.usage}`);
                await message.channel.send(embed);
            }
        });
        return promise;
    }
};