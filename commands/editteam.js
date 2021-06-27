const Discord = require('discord.js');
const Server = require('../items/Server');
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
                embed.setColor('RED');
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                    embed.setFooter(this.description);
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
                            const teamCol = tier.searchTeam(name.toLowerCase());
                            if (teamCol.size === 0) {
                                embed.setAuthor('Invalid team name! Did not match any team. Please try again!');
                                await message.channel.send(embed);
                                return;
                            } else if (teamCol.size > 1) {
                                const embed5 = new Discord.MessageEmbed();
                                embed5.setColor('RED');
                                embed5.setAuthor('Team name was found in many instances! Try to use the exact name!');
                                var teamList = '';
                                teamCol.forEach(team => {
                                    teamList += `- ${team.name}\n`;
                                });
                                embed5.setDescription(teamList);
                                message.channel.send(embed5);
                                return;
                            }
                            const team = teamCol.first();

                            if (messageReaction.emoji.name === "📝") {
                                embed.setAuthor('What would you like to rename this team to?');
                                await message.channel.send(embed);
                                const nameCollector = message.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                nameCollector.on('collect', m => {
                                    nameCollector.stop();
                                });
                                nameCollector.on('end', async mCol => {
                                    const updateName = mCol.first().content;
                                    if (updateName.length >= 256) {
                                        embed.setAuthor(`Team name cannot be longer than 256 characters!`);
                                        message.channel.send(embed);
                                        return;
                                    }
                                    const existingTeam = tier.getTeam(updateName);
                                    if (existingTeam) {
                                        embed.setAuthor('Team with that name already exists in that tier! Please try a different name!');
                                        message.channel.send(embed);
                                        return;
                                    }
                                    const oldName = team.name;
                                    team.setName(updateName);
                                    embed.setAuthor(`Edited team ${team.name} under tier ${tier.name} with drivers:`);
                                    var driverList1 = "";
                                    team.drivers.forEach(async driver => {
                                        driverList1 += (`- ${driver.member}\n`);
                                        await driver.update();
                                    });
                                    await server.update();
                                    embed.setDescription(driverList1);
                                    await message.channel.send(embed);
                                    await server.log(`${message.member.user.tag} has edited the name of team ${oldName} to ${team.name}`);
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
                                    team.drivers.forEach(driver => {
                                        driverList += (`- ${driver.member}\n`);
                                    });
                                    embed.setDescription(driverList);
                                    await message.channel.send(embed);
                                    await server.update();
                                    await server.log(`${message.member.user.tag} has added drivers to team ${team.name}`, driverList);
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