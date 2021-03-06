const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'setmodlog',
    aliases: ['modlogset'],
    usage: '[ #mod-log ]',
    description: 'Sets the mod-log channel',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        const embed = new Discord.MessageEmbed();
        embed.setColor('RED');
        const channel = message.mentions.channels.first();
        if (channel) {
            server.setModLog(channel);
            embed.setAuthor(`Mod-log channel was set to:`);
            embed.setDescription(`${channel}`);
            server.log(`This is now the mod-log channel for this bot!`);
            console.log(`[MODLOG] Set mod-log for server ${message.guild.name} to ${channel.id}`);
        } else {
            embed.setAuthor(`Usage is:`);
            embed.setDescription(`${server.prefix}${command} ${this.usage}`); 
            embed.setFooter(this.description);
        }
        message.channel.send(embed);
    }
};