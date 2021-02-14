const Discord = require('discord.js');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Team = require('../items/Team');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'addteam',
    aliases: ['newteam', 'createteam'],
    usage: '[ name ]',
    description: 'Creates a new team',
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
                message.channel.send(embed);
                return;
            }
            if (server.getTierManager().tiers.size === 0) {
                embed.setAuthor(`There are no tiers available! Create a new tier using ${server.prefix}addtier`);
                message.channel.send(embed);
                return;
            }
            const name = args.join(' ');
            if (name.length >= 256) {
                embed.setAuthor(`Team name cannot be longer than 256 characters!`);
                message.channel.send(embed);
                return;
            }
            let counter = 0;
            const questions = [
                'What tier is this team under?',
                'Tag/Mention all the drivers who are in this team'
            ];
            embed.setAuthor(questions[counter++]);
            await message.channel.send(embed);
            const filter = m => m.author.id === message.author.id;
            const collector = message.channel.createMessageCollector(filter, {
                max: 2, time: 60000
            });
            collector.on('collect', async m => {
                embed.setAuthor(questions[counter++]);
                await message.channel.send(embed);
            });
            collector.on('end', async (col) => {
                const tierName = col.first().content;
                const reply = col.last();

                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (!tier) {
                    embed.setAuthor('Invalid tier name! Did not match any tier. Please try again!');
                    await message.channel.send(embed);
                } else {
                    const existingTeam = tier.getTeam(name.toLowerCase());
                    if (existingTeam) {
                        embed.setAuthor('Team name already exists in that tier! Please use a different name!');
                        await message.channel.send(embed);
                    } else {
                        const mentions = reply.mentions.members;
                        const team = new Team(client, server, name, tier);
                        tier.addTeam(team);
                        const mentionP = new Promise((resolve, reject) => {
                            mentions.forEach(async (mention,index) => {
                                const driver = tier.drivers.get(mention.id);
                                const reserve = tier.reserves.get(mention.id);
                                if (!driver && !reserve) {
                                    const newDriver = new Driver(client, mention, server, team, 0, tier);
                                    team.setDriver(newDriver);
                                    tier.addDriver(newDriver);
                                    await newDriver.save();
                                } else if (reserve) {
                                    const newDriver = reserve.toDriver(team);
                                    team.setDriver(driver);
                                    tier.removeReserve(reserve);
                                    tier.addDriver(newDriver);
                                    await newDriver.update();
                                } else {
                                    driver.setTeam(team);
                                }
                                if (index === mentions.last().id) resolve();
                            });
                        });
                        mentionP.then(() => {
                            embed.setAuthor(`Created team ${team.name} under tier ${tier.name} with drivers:`);
                            var driverList = "";
                            const promise = new Promise((resolve, reject) => {
                                team.drivers.forEach(async (driver, index) => {
                                    driverList += (`- ${driver.member}\n`);
                                    if (index === team.drivers.last().id) resolve();
                                });
                            });
                            promise.then(async () => {
                                embed.setDescription(driverList);
                                await team.save();
                                await message.channel.send(embed);
                                server.log(`${message.member.user.tag} has created team ${team.name} under ${tier.name}`, driverList);
                            });
                        });
                    }
                }
            });
        }
    }
};