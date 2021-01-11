const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Reserve = require('../items/Reserve');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'adddriver',
    aliases: ['add-drivers', 'driveradd'],
    usage: '[ tier-name ]',
    description: 'Adds a driver to an existing tier',
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
                embed.setDescription(`${server.prefix}${this.name} ${this.usage}`);
                message.channel.send(embed);
                return;
            }
            const name = args.join(' ');
            const tier = server.getTierManager().getTier(name.toLowerCase());
            if (!tier) {
                embed.setAuthor('Tier does not exist! Here are the list of existing tiers:');
                var tierList = '';
                server.getTierManager().tiers.forEach(tier => {
                    tierList += `- ${tier.name}\n`;
                });
                embed.setDescription(tierList);
                message.channel.send(embed);
                return;
            }
            embed.setAuthor('Tag/Mention all the drivers to be added including reserves');
            await message.channel.send(embed);
            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector(filter, {
                max: 1, time: 60000
            });
            collector.on('end', async (col) => {
                const reply = col.first();
                const mentions = reply.mentions.members;
                mentions.forEach(mention => {
                    const reserve = new Reserve(client, mention, server, 0, tier);
                    tier.addReserve(reserve);
                });

                embed.setAuthor(`Updated tier ${tier.name} with drivers:`);
                var driverList = "";
                tier.reserves.forEach(reserve => {
                    driverList += (`- ${reserve.member}\n`);
                    reserve.save();
                });
                embed.setDescription(driverList);
                message.channel.send(embed);
            });
        }
    }
};