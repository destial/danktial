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
            try {
                if (!message.author) return;
                if (message.author.bot) return;
                if (!message.content) return;
                const server = await servers.fetch(message.guild.id);
                if (server) {
                    if (server.modlog) {
                        await server.log(`Message deleted from ${message.member.user.tag} under #${message.channel.name}`, message.content);
                    }
                }
            } catch(err) {}
        });

        client.on('messageUpdate', async (oldMessage, newMessage) => {
            try {
                if (!newMessage.author) return;
                if (newMessage.author.bot) return;
                if (oldMessage.content === newMessage.content) return;
                if (oldMessage.partial) return;
                const server = await servers.fetch(newMessage.guild.id);
                if (server) {
                    await server.log(`Message edited from ${newMessage.member.user.tag} under #${newMessage.channel.name}`, `[Jump to message](${newMessage.url})`, 
                    [
                        { name: 'Old Message', value: (oldMessage.content.length > 512 ? `${oldMessage.content.substring(0, 512)}...` : oldMessage.content), inline: false },
                        { name: 'New Message', value: (newMessage.content.length > 512 ? `${newMessage.content.substring(0, 512)}...` : newMessage.content), inline: false }
                    ]);
                }
            } catch(err) {}
        });
    }
};