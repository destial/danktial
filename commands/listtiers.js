const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'tiers',
    aliases: ['listtier', 'alltiers'],
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
        try {
            if (!args.length) {
                embed.setAuthor('This is all the tiers:');
                var tierList = '';
                server.getTierManager().tiers.forEach(tier => {
                    tierList += `- ${tier.name}\n`;
                });
                embed.setDescription(tierList);
                await message.channel.send(embed);
            } else {
                const tierName = args.join(' ');
                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (tier) {
                    embed.setAuthor(`Details of ${tier.name}`);
                    tier.teams.forEach(team => {
                        const driverNames = [];
                        team.drivers.forEach(driver => {
                            driverNames.push(`<@${driver.id}>`);
                        });
                        embed.addField(team.name, driverNames.join('\n'), false);
                    });
                    if (tier.reserves.size !== 0) {
                        const reserveNames = [];
                        tier.reserves.forEach(reserve => {
                            reserveNames.push(`<@${reserve.id}>`);
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
    }
};