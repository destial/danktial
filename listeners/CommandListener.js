const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const fs = require('fs');

require('../utils/ExtendedMessage');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        client.commands = new Discord.Collection();
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            client.commands.set(command.name.toLowerCase(), command);
            if (command.aliases) {
                command.aliases.forEach((alias) => {
                    client.commands.set(alias.toLowerCase(), command);
                });
            }
        }
        client.on('message', async (message) => {
            if (!message.author) return;
            if (message.author.bot) return;
            if (!message.guild) return;
            const msg = message.content;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                if (message.content.startsWith(server.prefix)) {
                    const args = msg.slice(server.prefix.length).split(' ');
                    const command = args.shift().toLowerCase();
                    try {
                        if (client.commands.get(command)) {
                            await client.commands.get(command).run(client, server, command, args, message);
                        }
                    } catch (err) {
                        client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                    }
                }
            }
        });
    }
};