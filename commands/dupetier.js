const Discord = require('discord.js');
const Server = require('../items/Server');
const Team = require('../items/Team');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'dupetier',
    aliases: ['copytier', 'duplicate-tier'],
    usage: '[ existing tier name ]',
    description: 'Duplicates an existing tier with the same teams but without drivers',
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
            const existingTier = server.getTierManager().getTier(name.toLowerCase());
            if (existingTier) {
                embed.setAuthor('What would you like to name this duplicate tier?');
                await message.channel.send(embed);
                let filter = m => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector(filter, {
                    max: 1, time: 5*60000
                });
                collector.on('collect', async (m) => {
                    collector.stop();
                });
                collector.once('end', async (col) => {
                    const reply = col.first();
                    if (reply) {
                        const newName = reply.content;
                        const newTier = new Tier(client, server, newName);
                        newTier.save();
                        existingTier.teams.forEach(team => {
                            const newTeam = new Team(client, server, team.name, newTier);
                            newTier.addTeam(newTeam);
                            newTeam.save();
                        });

                        embed.setAuthor(`Successfully duplicated tier ${newTier.name} from ${existingTier.name}. Here are the teams:`);
                        var teamList = '';
                        newTier.teams.forEach(team => {
                            teamList += `- ${team.name}\n`;
                        });
                        
                        embed.setDescription(teamList);
                        message.channel.send(embed);
                    } else {
                        embed.setAuthor('Ran out of time!');
                        message.channel.send(embed);
                    }
                });
            }
        }
    }
};