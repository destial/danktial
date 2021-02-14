const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'tiers',
    aliases: ['listtier', 'alltiers', 'listtiers'],
    usage: '< name >',
    description: 'Lists all the tiers',
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
        message.channel.startTyping();
        try {
            if (!args.length) {
                embed.setAuthor('These are all the tiers:');
                var tierList = '';
                if (server.getTierManager().tiers.size === 0) {
                    tierList = '-';
                }
                server.getTierManager().tiers.forEach(tier => {
                    tierList += `- ${tier.name}\n`;
                });
                embed.setDescription(tierList);
                embed.setFooter(`For more details on a tier, use ${server.prefix}${command} [name]`);
                await message.channel.send(embed);
            } else {
                const tierName = args.join(' ');
                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (tier) {
                    embed.setAuthor(`Details of ${tier.name}`);
                    tier.teams.forEach(team => {
                        const driverNames = [];
                        if (team.drivers.size === 0) {
                            driverNames.push('-');
                        }
                        team.drivers.forEach(driver => {
                            driverNames.push(driver.toFullName());
                        });
                        embed.addField(team.name, driverNames.join('\n'), false);
                    });
                    if (tier.reserves.size !== 0) {
                        const reserveNames = [];
                        tier.reserves.forEach(reserve => {
                            reserveNames.push(reserve.toFullName());
                        });
                        embed.addField('Reserves', reserveNames, false);
                    }
                    await message.channel.send(embed);
                } else {
                    embed.setAuthor('Tier does not exist!');
                    await message.channel.send(embed);
                }
            }
        } catch (err) {
            console.log(err);
        }
        message.channel.stopTyping(true);
    }
};