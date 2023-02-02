const Discord = require('discord.js');
const Database = require('../database/Database');
const Reserve = require('../items/Reserve');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'addtier',
    aliases: ['newtier', 'createtier'],
    usage: '[name]',
    description: 'Creates a new tier',
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
            embed.setFooter(`*WARINING* This command is deprecated and should be avoided! Use ${server.prefix}dupetier instead!`);
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                message.channel.send({ embeds: [embed] });
                return;
            }
            const name = args.join(' ');
            if (name.length >= 256) {
                const embed6 = new Discord.MessageEmbed().setAuthor(`Tier name cannot be longer than 256 characters!`);
                message.channel.send({ embeds: [embed6] });
                return;
            }
            const tier = new Tier(client, server, name);
            embed.setAuthor('Tag/Mention all the drivers who are in this tier, including reserves');
            await message.channel.send({ embeds: [embed] });
            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector(filter, {
                max: 1, time: 60000
            });
            collector.on('end', async (col) => {
                const reply = col.first();
                if (!reply) {
                    embed.setAuthor('No response! Exiting add mode!');
                    message.channel.send({ embeds: [embed] });
                    return;
                }
                const mentions = reply.mentions.members;
                mentions.forEach(mention => {
                    const reserve = new Reserve(client, mention, server, 0, tier);
                    tier.addReserve(reserve);
                });
                server.getTierManager().addTier(tier);
                server.getTierManager().tiers.sort((a, b) => a.name.localeCompare(b.name));
                client.emit('serverUpdate', server);
                embed.setAuthor(`Created tier ${name} with drivers:`);
                var driverList = "";
                tier.reserves.forEach(reserve => {
                    driverList += (`- ${reserve.member}\n`);
                    reserve.save();
                });
                embed.setDescription(`${driverList}\nNext step is using ` + server.prefix + `setdriver`);
                message.channel.send({ embeds: [embed] });
                server.log(`${message.member.user.tag} has added tier ${tier.name}`);
                Database.run(Database.tierSaveQuery, [server.id, name]);
            });
        }
    }
};