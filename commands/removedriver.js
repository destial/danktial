const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'removedriver',
    aliases: ['deldriver', 'deletedriver'],
    usage: '[ @name ] [ tier name ]',
    description: 'Deletes an existing driver in a specific tier',
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
                embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                await message.channel.send(embed);
                return;
            }
            const arg1 = args.shift();
            const id = arg1.replace('<@', '').replace('>', '').replace('!', '');
            const member = await server.guild.members.fetch(id);
            if (member) {
                const tierName = args.join(" ");
                if (!tierName) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                    await message.channel.send(embed);
                    return;
                }
                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (tier) {
                    const driver = tier.getDriver(member.id);
                    const reserve = tier.getReserve(member.id);
                    if (driver) {
                        driver.team.removeDriver(member.id);
                        tier.removeDriver(member.id);
                        await driver.delete();
                        embed.setAuthor(`Removed driver ${driver.name} from tier ${tier.name}`);
                    } else if (reserve) {
                        tier.removeReserve(member.id);
                        await reserve.delete();
                        embed.setAuthor(`Removed reserve ${driver.name} from tier ${tier.name}`);
                    } else {
                        embed.setAuthor(`Unknown driver / reserve ${member.user.username}`);
                    }
                    await message.channel.send(embed);
                }
            }
        }
    }
};