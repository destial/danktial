const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

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
        if (isStaff(message.member)) {
            //var category = server.guild.channels.cache.find((c) => c.name.toLowerCase().includes('count') && c.type === 'category');
            try {
                const category = server.guild.channels.cache.find((c) => c.name.toLowerCase().includes('count') && c.type === 'category');
                if (args[0] === "all") {
                    if (!category && !server.getCountManager().getCount('member') && !server.getCountManager().getCount('channel') && !server.getCountManager().getCount('role')) {
                        server.guild.channels.create('count', {
                            type: 'category',
                            permissionOverwrites: [
                                {
                                    id: server.guild.roles.everyone.id,
                                    deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                }
                            ]
                        }).then((cat) => {
                            server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: cat
                            }).then(membercount => {
                                server.getCountManager().setCount('member', membercount);
                                server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);
                                
                                server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                    type: 'voice',
                                    permissionOverwrites: [
                                        {
                                            id: server.guild.roles.everyone.id,
                                            deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                        }
                                    ],
                                    parent: cat
                                }).then(channelcount => {
                                    server.getCountManager().setCount('channel', channelcount);
                                    server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);

                                    server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                        type: 'voice',
                                        permissionOverwrites: [
                                            {
                                                id: server.guild.roles.everyone.id,
                                                deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                            }
                                        ],
                                        parent: cat
                                    }).then(rolecount => {
                                        server.getCountManager().setCount('role', rolecount);
                                        server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);
                
                                        const embed = new Discord.MessageEmbed()
                                            .setAuthor('Created All Counts!');
                                        message.channel.send(embed);
                                    });
                                });
                            });
                        });
                    } else if (!server.getCountManager().getCount('member') && !server.getCountManager().getCount('channel') && !server.getCountManager().getCount('role')) {
                        server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                            type: 'voice',
                            permissionOverwrites: [
                                {
                                    id: server.guild.roles.everyone.id,
                                    deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                }
                            ],
                            parent: category
                        }).then(membercount => {
                            server.getCountManager().setCount('member', membercount);
                            server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);

                            server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            }).then(channelcount => {
                                server.getCountManager().setCount('channel', channelcount);
                                server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);

                                server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                    type: 'voice',
                                    permissionOverwrites: [
                                        {
                                            id: server.guild.roles.everyone.id,
                                            deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                        }
                                    ],
                                    parent: category
                                }).then(rolecount => {
                                    server.getCountManager().setCount('role', rolecount);
                                    server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);
            
                                    const embed = new Discord.MessageEmbed()
                                        .setAuthor('Created All Counts!');
                                    message.channel.send(embed);
                                });
                            });
                        });
                    }
                } else if (args[0] === 'member') {
                    if (!server.getCountManager().getCount('member')) {
                        if (!category) {
                            server.guild.channels.create('count', {
                                type: 'category',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ]
                            }).then((cat) => {
                                server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                                    type: 'voice',
                                    permissionOverwrites: [
                                        {
                                            id: server.guild.roles.everyone.id,
                                            deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                        }
                                    ],
                                    parent: cat
                                }).then(membercount => {
                                    server.getCountManager().setCount('member', membercount);
                                    const embed = new Discord.MessageEmbed()
                                        .setAuthor('Created Member Count!');
                                    message.channel.send(embed);
                                    server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);
                                });
                            });
                        } else {
                            server.guild.channels.create(`Member Count: ${server.guild.memberCount}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            }).then(membercount => {
                                server.getCountManager().setCount('member', membercount);
                                const embed = new Discord.MessageEmbed()
                                    .setAuthor('Created Member Count!');
                                message.channel.send(embed);
                                server.log(`${message.member.user.tag} has set the membercount channel`, `${membercount} (ID=${membercount.id})`);
                            });
                        }
                    }
                } else if (args[0] === 'role') {
                    if (!server.getCountManager().getCount('role')) {
                        if (!category) {
                            server.guild.channels.create('count', {
                                type: 'category',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ]
                            }).then((cat) => {
                                server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                    type: 'voice',
                                    permissionOverwrites: [
                                        {
                                            id: server.guild.roles.everyone.id,
                                            deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                        }
                                    ],
                                    parent: cat
                                }).then(rolecount => {
                                    server.getCountManager().setCount('role', rolecount);
                                    const embed = new Discord.MessageEmbed()
                                        .setAuthor('Created Role Count!');
                                    message.channel.send(embed);
                                    server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);
                                });
                            });
                        } else {
                            server.guild.channels.create(`Role Count: ${server.guild.roles.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            }).then(rolecount => {
                                server.getCountManager().setCount('role', rolecount);
                                const embed = new Discord.MessageEmbed()
                                    .setAuthor('Created Role Count!');
                                message.channel.send(embed);
                                server.log(`${message.member.user.tag} has set the rolecount channel`, `${rolecount} (ID=${rolecount.id})`);
                            });
                        }
                    }
                } else if (args[0] === 'channel') {
                    if (!server.getCountManager().getCount('channel')) {
                        if (!category) {
                            server.guild.channels.create('count', {
                                type: 'category',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ]
                            }).then((cat) => {
                                server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                    type: 'voice',
                                    permissionOverwrites: [
                                        {
                                            id: server.guild.roles.everyone.id,
                                            deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                        }
                                    ],
                                    parent: cat
                                }).then(channelcount => {
                                    server.getCountManager().setCount('channel', channelcount);
                                    const embed = new Discord.MessageEmbed()
                                        .setAuthor('Created Channel Count!');
                                    message.channel.send(embed);
                                    server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);
                                });
                            });
                        } else {
                            server.guild.channels.create(`Channel Count: ${server.guild.channels.cache.size}`, {
                                type: 'voice',
                                permissionOverwrites: [
                                    {
                                        id: server.guild.roles.everyone.id,
                                        deny: ['CONNECT', 'PRIORITY_SPEAKER']
                                    }
                                ],
                                parent: category
                            }).then(channelcount => {
                                server.getCountManager().setCount('channel', channelcount);
                                const embed = new Discord.MessageEmbed()
                                    .setAuthor('Created Channel Count!');
                                message.channel.send(embed);
                                server.log(`${message.member.user.tag} has set the channelcount channel`, `${channelcount} (ID=${channelcount.id})`);
                            });
                        }
                    } else {
                        const embed = new Discord.MessageEmbed()
                            .setAuthor('Usage is:')
                            .setDescription(`${server.prefix}${this.name} ${this.usage}`);
                        await message.channel.send(embed);
                    }
                }
            } catch (err) {
                console.log('[ERROR] Something happened while trying to create count channels!', err);
            }
        }
    }
};