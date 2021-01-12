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
                await server.setPrefix(args[0]);
                embed.setAuthor(`Prefix has been set to: ${server.prefix}`);
                message.channel.send(embed);
                server.log('Server command prefix for this bot has been switched to:', "`" + server.prefix + "`");
            } else {
                embed.setAuthor(`Prefix should be at most 3 characters long! E.g ${server.prefix}setprefix - or ${server.prefix}setprefix ///`);
                await message.channel.send(embed);
            }
        }
    }
};