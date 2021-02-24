const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'alerts',
    usage: `[ setchannel | add | remove :list ] [ #channel | name ]`,
    description: 'Sets the alerts page for twitch channels',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            const embed = new Discord.MessageEmbed();
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                await message.channel.send(embed);
                return;
            }
            if (args[0].toLowerCase() === 'setchannel') {
                const channel = message.mentions.channels.first();
                if (!channel) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    await message.channel.send(embed);
                    return;
                }
                server.setAlerts(channel);
                embed.setAuthor(`Set #${server.alertChannel.name} as Twitch alerts channel!`);
                message.channel.send(embed);
            }
        }
    }
};