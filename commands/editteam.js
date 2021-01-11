const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Team = require('../items/Team');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'editteam',
    aliases: ['editt'],
    usage: '[ team ]',
    description: 'Edits an existing team',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        try {
            if (isStaff(message.member)) {
                const embed = new Discord.MessageEmbed();
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${this.name} ${this.usage}`);
                    await message.channel.send(embed);
                    return;
                }
                if (server.getTierManager().tiers.size === 0) {
                    embed.setAuthor(`There are no tiers available! Create a new tier using ${server.prefix}addtier`);
                    return;
                }
                const name = args.join(' ');
                let counter = 0;
                const questions = [
                    'What tier is this team under?',
                    'React with 📝 to edit the name, or 🏎️ to edit the drivers'
                ];
                embed.setAuthor(questions[counter++]);
                await message.channel.send(embed);
                const filter = m => m.author.id === message.author.id;
                const collector = message.channel.createMessageCollector(filter, {
                    max: 1, time: 60000
                });
                var tierName = '';
                collector.on('collect', async m => {
                    embed.setAuthor(questions[counter++]);
                    const reply = await message.channel.send(embed);
                    if (counter !== questions.length) {
                    } else {
                        tierName = m.content.toLowerCase();
                        collector.stop();
                        await reply.react('📝');
                        await reply.react('🏎️');
                        const rfilter = (r, u) => (r.message.id === reply.id && u.id === message.member.id);
                        const rCollector = reply.createReactionCollector(rfilter, {
                            max: 1, time: 60000
                        });
                        rCollector.on('collect', (r, u) => {
                            rCollector.stop();
                        });
                        rCollector.on('end', async col => {
                            const messageReaction = col.first();
            
                            const tier = server.getTierManager().getTier(tierName.toLowerCase());
                            if (!tier) {
                                embed.setAuthor('Invalid tier name! Did not match any tier. Please try again!');
                                await message.channel.send(embed);
                                return;
                            }
                            const team = tier.getTeam(name.toLowerCase());
                            if (!team) {
                                embed.setAuthor('Invalid team name! Did not match any team. Please try again!');
                                await message.channel.send(embed);
                                return;
                            }

                            if (messageReaction.emoji.name === "📝") {
                                embed.setAuthor('What would you like to rename this team to?');
                                await message.channel.send(embed);
                                const nameCollector = message.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                nameCollector.on('collect', m => {
                                    nameCollector.stop();
                                });
                                nameCollector.on('end', async mCol => {
                                    team.name = mCol.first().content;
                                    await team.update();
                                    var driverList1 = "";

                                    embed.setAuthor(`Edited team ${team.name} under tier ${tier.name} with drivers:`);
                                    team.drivers.forEach(async driver => {
                                        driverList1 += (`- ${driver.member}\n`);
                                        await driver.update();
                                    });
                                    embed.setDescription(driverList1);
                                    await message.channel.send(embed);
                                });
                            } else if (messageReaction.emoji.name === "🏎️") {
                                team.drivers.clear();
                                embed.setAuthor('Tag/Mention all the drivers who are in this team');
                                await message.channel.send(embed);
                                const driverCollector = message.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                driverCollector.on('collect', m => {
                                    driverCollector.stop();
                                });
                                driverCollector.once('end', async dCol => {
                                    const mentions = dCol.first().mentions.members;
                                    team.drivers.forEach(driver => {
                                        driver.setTeam(undefined);
                                    });
                                    team.drivers.clear();
                                    mentions.forEach(async mention => {
                                        var driver = tier.drivers.get(mention.id);
                                        if (!driver) {
                                            driver = tier.reserves.get(mention.id);
                                        }
                                        if (!driver) {
                                            embed.setAuthor(`${mention.user.tag} does not exist in tier ${tier.name}`);
                                            message.channel.send(embed);
                                        } else {
                                            team.setDriver(driver);
                                            driver.setTeam(team);
                                            await driver.update();
                                        }
                                    });
                                    embed.setAuthor(`Edited team ${name} under tier ${tier.name} with drivers:`);
                                    var driverList = "";
                                    team.drivers.forEach(async driver => {
                                        driverList += (`- ${driver.member}\n`);
                                    });
                                    embed.setDescription(driverList);
                                    await message.channel.send(embed);
                                });
                            }
                        });
                    }
                });
            }
        } catch(err) {
            console.log(err);
        }
    }
};