const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('message', async (message) => {
            if (!message.author) return;
            if (message.author.bot) return;
            if (!message.guild) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const trigger = server.getTriggerManager().getTrigger(message.content);
                if (trigger) {
                    message.channel.send(trigger.response);
                }
            }
        });
    }
};