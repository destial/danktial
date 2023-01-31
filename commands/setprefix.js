const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    usage: '[ prefix ]',
    description: 'Sets the command prefix',
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
            if (args.length && args.length <= 3) {
                server.setPrefix(args[0]);
                embed.setAuthor(`Prefix has been set to: ${args[0]}`);
                message.channel.send({ embeds: [embed] });
                server.log('Server command prefix for this bot has been switched to:', "`" + args[0] + "`");
                console.log(`[PREFIX] Prefix for guild ${server.guild.name} changed to ${args[0]}`);
            } else {
                embed.setAuthor(`Prefix should be at most 3 characters long! E.g ${server.prefix}${command} - or ${server.prefix}${command} ///`);
                embed.setFooter(this.description);
                message.channel.send({ embeds: [embed] });
            }
        }
    }
};