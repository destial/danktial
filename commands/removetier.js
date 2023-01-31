const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');
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
            embed.setColor('RED');
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send({ embeds: [embed] });
                return;
            }
            const name = args.join(' ');
            const tier = server.getTierManager().getTier(name);
            if (tier) {
                try {
                    tier.teams.forEach(async team => {
                        await Database.run(Database.teamDeleteQuery, [server.id, team.name, tier.name]);
                    });
                    tier.teams.clear();
                    tier.reserves.forEach(async reserve => {
                        await Database.run(Database.driversDeleteQuery, [reserve.id, server.id, tier.name]);
                    });
                    tier.reserves.clear();
                    Database.run(Database.tierDeleteQuery, [tier.server.id, tier.name]);
                    server.getTierManager().removeTier(tier);
                    embed.setAuthor(`Deleted tier ${tier.name}`);
                    server.log(`${message.member.user.tag} has deleted tier ${tier.name}`);
                    message.channel.send({ embeds: [embed] });
                    console.log(`[TIER] Deleted tier ${tier.name} from server ${server.guild.name}`);
                    server.save();
                } catch(err) {
                    console.log(err);
                }
            } else {
                embed.setAuthor('Tier does not exist!');
                message.channel.send({ embeds: [embed] });
                return;
            }
        }
    }
};