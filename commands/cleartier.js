const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'cleartier',
    aliases: ['tierclear'],
    usage: '[ tier name ]',
    description: 'Clears the drivers in a tier',
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
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                await message.channel.send(embed);
                return;
            }
            const tierName = args.join(' ');
            const tier = server.getTierManager().getTier(tierName);
            if (tier) {
                await tier.clear();
                embed.setAuthor(`Tier ${tier.name} has been cleared of all drivers and reserves!`);
                await server.log(`Cleared tier ${tier.name} from all drivers and reserves`);
                await message.channel.send(embed);
            } else {
                embed.setAuthor(`Unknown tier "${tierName}"`);
                await message.channel.send(embed);
            }
        }
    }
};