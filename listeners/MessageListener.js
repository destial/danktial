const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('messageDelete', async (message) => {
            if (message.partial) {
                return;
            }
            if (!message.author) return;
            if (message.author.bot) return;
            if (!message.content) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                if (server.modlog) {
                    await server.log(`Message deleted from user ${message.member.user.tag}`, message.content);
                }
            }
        });

        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (oldMessage.partial || newMessage.partial) {
                try {
                    oldMessage = await oldMessage.fetch();
                    newMessage = await newMessage.fetch();
                } catch (err) {
                    console.log('[ERROR] Something happened while fetching uncached edited messages!', err);
                }
                if (!newMessage.author) return;
                if (newMessage.author.bot) return;
                if (oldMessage.content === newMessage.content) return;
                const server = await servers.fetch(newMessage.id);
                if (server) {
                    if (server.modlog) {
                        const fields = [
                            { name: 'Old Message', value: oldMessage.content, inline: false },
                            { name: 'New Message', value: newMessage.content, inline: false }
                        ];
                        await server.log(`Message updated from user ${newMessage.member.user.tag}`, undefined, fields);
                    }
                }
            }
        });
    }
};