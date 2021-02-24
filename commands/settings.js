const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');
module.exports = {
    name: 'settings',
    usage: '[ ticket ] [ true/false ] ',
    example: 'settings ticket false',
    description: 'Sets the server settings',
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
            embed.setColor('RED');
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage} \n E.g ${server.prefix}${this.example}`);
                message.channel.send(embed);
                return;
            }
            if (args[0].toLowerCase() === 'ticket') {
                if (!args[1]) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage} \n E.g ${server.prefix}${this.example}`);
                    message.channel.send(embed);
                    return;
                }
                if (args[1].toLowerCase() === 'true') {
                    server.enableTickets = true;
                    const data = {
                        enableTickets: true
                    };
                    await Database.run(Database.serverDataUpdateQuery, [server.id, JSON.stringify(data)]);
                    embed.setAuthor('Enabled tickets!');
                    message.channel.send(embed);
                } else if (args[1].toLowerCase() === 'false') {
                    server.enableTickets = false;
                    const data = {
                        enableTickets: false
                    };
                    await Database.run(Database.serverDataUpdateQuery, [server.id, JSON.stringify(data)]);
                    embed.setAuthor('Disabled tickets!');
                    message.channel.send(embed);
                } else {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage} \n E.g ${server.prefix}${this.example}`);
                    message.channel.send(embed);
                    return;
                }
            }
        }
    }
};