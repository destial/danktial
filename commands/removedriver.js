const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'removedriver',
    aliases: ['deldriver', 'deletedriver'],
    usage: '[@driver] [tier]',
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
            embed.setColor('RED');
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send({ embeds: [embed] });
                return;
            }
            args.shift();
            const member = message.mentions.members.first();
            if (member) {
                const tierName = args.join(' ');
                if (!tierName) {
                    embed.setAuthor('No tier was supplied! Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    message.channel.send({ embeds: [embed] });
                    return;
                }
                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (tier) {
                    const driver = tier.getDriver(member.id);
                    const reserve = tier.getReserve(member.id);
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setColor('RED');
                    if (reserve) {
                        tier.removeReserve(member.id);
                        reserve.delete();
                        embed2.setAuthor(`Removed reserve ${reserve.member.user.tag} from tier ${tier.name}`);
                        server.log(`${message.member.user.username} has removed reserve ${reserve.member.user.tag} from tier ${tier.name}`);
                        server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                            if (advanced.tier.name === tier.name)
                                advanced.fix();
                        });
                    } else if (driver) {
                        driver.team.removeDriver(member.id);
                        tier.removeDriver(member.id);
                        driver.delete();
                        embed2.setAuthor(`Removed driver ${driver.member.user.tag} from tier ${tier.name}`);
                        server.log(`${message.member.user.username} has removed driver ${driver.member.user.tag} from tier ${tier.name}`);
                        server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                            if (advanced.tier.name === tier.name)
                                advanced.fix();
                        });
                    } else {
                        embed2.setAuthor(`Unknown driver / reserve ${member.user.username}`);
                    }
                    message.channel.send({ embeds: [embed] });
                    server.save();
                    return;
                }
            } else {
                embed.setAuthor('No user was tagged! Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send({ embeds: [embed] });
                return;
            }
        }
    }
};