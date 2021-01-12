const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'removetier',
    aliases: ['deltier', 'deletetier'],
    usage: '[ name ]',
    description: 'Deletes an existing tier',
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
                await message.channel.send(embed);
                return;
            }
            const name = args.join(' ');
            const tier = server.getTierManager().getTier(name.toLowerCase());
            if (tier) {
                try {
                    tier.teams.forEach(async team => {
                        await Database.run(Database.teamDeleteQuery, [team.server.id, team.name, tier.name]);
                    });
                    tier.teams.clear();

                    tier.drivers.forEach(async driver => {
                        await Database.run(Database.driversDeleteQuery, [driver.id, driver.guild.id, tier.name]);
                    });
                    tier.drivers.clear();

                    tier.reserves.forEach(async reserve => {
                        await Database.run(Database.driversDeleteQuery, [reserve.id, reserve.guild.id, tier.name]);
                    });
                    tier.reserves.clear();

                    await Database.run(Database.tierDeleteQuery, [tier.server.id, tier.name]);
                    server.getTierManager().removeTier(tier);
                    embed.setAuthor(`Deleted tier ${tier.name}`);
                    server.log(`${message.member.user.tag} has deleted tier ${tier.name}`);
                    await message.channel.send(embed);
                    console.log(`[TIER] Deleted tier ${tier.name} from server ${tier.server.guild.name}`);
                } catch(err) {
                    console.log(err);
                }
            } else {
                embed.setAuthor('Tier does not exist!');
                await message.channel.send(embed);
            }
        }
    }
};