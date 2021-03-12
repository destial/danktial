const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'settings',
    usage: '[ ticket | twitchalerts | addchannel | removechannel ] [ true/false | #channel | twitch_channel_name] ',
    example: 'settings ticket false OR settings twitchalerts #media OR settings addchannel destiall',
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
                embed.setFooter(this.description);
                message.channel.send(embed);
                return;
            }
            if (args[0].toLowerCase() === 'ticket') {
                if (!args[1]) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage} \n E.g ${server.prefix}${this.example}`);
                    embed.setFooter(this.description);
                    message.channel.send(embed);
                    return;
                }
                if (args[1].toLowerCase() === 'true') {
                    server.enableTickets = true;
                    await server.update();
                    embed.setAuthor('Enabled tickets!');
                    message.channel.send(embed);
                } else if (args[1].toLowerCase() === 'false') {
                    server.enableTickets = false;
                    await server.update();
                    embed.setAuthor('Disabled tickets!');
                    message.channel.send(embed);
                } else {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage} \n E.g ${server.prefix}${this.example}`);
                    message.channel.send(embed);
                    return;
                }
            } else if (args[0].toLowerCase() === 'twitchalerts') {
                const channel = message.mentions.channels.first();
                if (channel) {
                    server.alertChannel = channel;
                    await server.update();
                    embed.setAuthor(`Set #${channel.name} as the Twitch Alerts channel!`);
                    message.channel.send(embed);
                    return;
                }
                server.alertChannel = undefined;
                embed.setAuthor(`Removed Twitch Alerts channel!`);
                message.channel.send(embed);
                return;
            } else if (args[0].toLowerCase() === 'addchannel') {
                server.addChannel(args[1].toLowerCase());
                await server.update();
                embed.setAuthor(`Added channel ${args[1].toLowerCase()} to the Twitch Alerts!`);
                message.channel.send(embed);
                return;
            } else if (args[0].toLowerCase() === 'removechannel') {
                const twitchChannel = server.alerts.allChannels().find(ch => ch.name.toLowerCase() === args[1].toLowerCase());
                if (twitchChannel) {
                    server.removeChannel(args[1].toLowerCase());
                    await Database.run(Database.serverDataUpdateQuery, [server.id, JSON.stringify(server.toJSON())]);
                    await server.update();
                    embed.setAuthor(`Removed channel ${args[1].toLowerCase()} from the Twitch Alerts!`);
                    message.channel.send(embed);
                    return;
                }
                embed.setAuthor('No channels with that name can be found! Here is the list of subscribed channels:');
                var channelList = '';
                server.alerts.allChannels().forEach(tc => {
                    channelList += `${tc.name}\n`;
                });
                embed.setDescription(channelList);
                message.channel.send(embed);
                return;
            } 
        }
    }
};