const Discord = require('discord.js');
const Server = require('../items/Server');
const ServerManager = require('../managers/ServerManager');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers
     */
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (reaction.partial) {
                try {
                    reaction = await reaction.fetch();
                } catch(err) {
                    console.log(`[REACTIONROLE] Something wrong while caching uncached message reactions addition!`, err);
                }
            }
            if (user.partial) {
                try {
                    user = await user.fetch();
                } catch(err) {
                    console.log(`[REACTIONROLE] Something wrong while caching uncached message reactions addition!`, err);
                }
            }
            if (!reaction.message.guild) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const reactionPanel = server.getReactionRoleManager().fetch(reaction.message.id);
                if (reactionPanel) {
                    const reactionrole = reactionPanel.getReactionRole(reaction.emoji.id);
                    if (reactionrole) {
                        const member = server.guild.members.cache.get(user.id);
                        if (member) {
                            if (!member.roles.cache.get(reactionrole.role.id)) {
                                member.roles.add(reactionrole.role);
                            }
                        }
                    }
                }
            }
        });

        client.on('messageReactionRemove', async (reaction, user) => {
            if (reaction.partial) {
                try {
                    reaction = await reaction.fetch();
                } catch(err) {
                    console.log(`[REACTIONROLE] Something wrong while caching uncached message reactions removal!`, err);
                }
            }
            if (user.partial) {
                try {
                    user = await user.fetch();
                } catch(err) {
                    console.log(`[REACTIONROLE] Something wrong while caching uncached message reactions removal!`, err);
                }
            }
            if (!reaction.message.guild) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const reactionPanel = server.getReactionRoleManager().fetch(reaction.message.id);
                if (reactionPanel) {
                    const reactionrole = reactionPanel.getReactionRole(reaction.emoji.id);
                    if (reactionrole) {
                        const member = server.guild.members.cache.get(user.id);
                        if (member) {
                            if (member.roles.cache.get(reactionrole.role.id)) {
                                member.roles.remove(reactionrole.role);
                            }
                        }
                    }
                }
            }
        });

        client.on('emojiDelete', async (emoji) => {
            const server = await servers.fetch(emoji.guild.id);
            if (server) {
                const reactionPanel = server.getReactionRoleManager().fetch(reaction.message.id);
                if (reactionPanel) {
                    const reactionrole = reactionPanel.getReactionRole(reaction.emoji.id);
                    if (reactionrole) {
                        const member = server.guild.members.cache.get(user.id);
                        if (member) {
                            if (member.roles.cache.get(reactionrole.role.id)) {
                                member.roles.remove(reactionrole.role);
                            }
                        }
                    }
                }
            }
        });
    }
};