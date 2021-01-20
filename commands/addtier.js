const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Reserve = require('../items/Reserve');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'addtier',
    aliases: ['newtier'],
    usage: '[ name ]',
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
            embed.setFooter(`*WARINING* This command is deprecated and should be avoided! Use ${server.prefix}dupetier instead!`);
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${this.name} ${this.usage}`);
                await message.channel.send(embed);
                return;
            }
            const name = args.join(' ');
            const tier = new Tier(client, server, name);
            embed.setAuthor('Tag/Mention all the drivers who are in this tier, including reserves');
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
                server.getTierManager().addTier(tier);

                embed.setAuthor(`Created tier ${name} with drivers:`);
                var driverList = "";
                tier.reserves.forEach(reserve => {
                    driverList += (`- ${reserve.member}\n`);
                    reserve.save();
                });
                embed.setDescription(`${driverList}\nNext step is using` + server.prefix + `setdriver`);
                await message.channel.send(embed);
                server.log(`${message.member.user.tag} has added tier ${tier.name}`);
                await Database.run(Database.tierSaveQuery, [server.id, name]);
            });
        }
    }
};