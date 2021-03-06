const Discord = require('discord.js');
const Driver = require('../items/Driver');
const Server = require('../items/Server');
const Team = require('../items/Team');
const AttendanceManager = require('../managers/AttendanceManager');
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
                embed.setFooter(this.description);
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
                message.channel.send(embed);
            });
            collector.on('end', async (col) => {
                if (!col.first()) {
                    embed.setAuthor('No response! Exiting add mode!');
                    message.channel.send(embed);
                    return;
                }
                const tierName = col.first().content;
                const reply = col.last();
                const tier = server.getTierManager().getTier(tierName.toLowerCase());
                if (!tier) {
                    embed.setAuthor('Invalid tier name! Did not match any tier. Please try again!');
                    message.channel.send(embed);
                    return;
                } else {
                    const existingTeam = tier.getTeam(name.toLowerCase());
                    if (existingTeam) {
                        embed.setAuthor('Team name already exists in that tier! Please use a different name!');
                        message.channel.send(embed);
                        return;
                    } else {
                        const mentions = reply.mentions.members;
                        const team = new Team(client, server, name, tier);
                        tier.addTeam(team);
                        const mentionP = new Promise((resolve, reject) => {
                            if (mentions.size === 0) resolve();
                            mentions.forEach(async (mention,index) => {
                                const reserve = tier.reserves.get(mention.id);
                                const driver = tier.getDriver(mention.id);
                                if (reserve) {
                                    const newDriver = reserve.toDriver(team);
                                    team.setDriver(newDriver);
                                    tier.removeReserve(reserve);
                                    tier.addDriver(newDriver);
                                    newDriver.update();
                                } else if (!driver) {
                                    const newDriver = new Driver(client, mention, server, team, 0, tier);
                                    team.setDriver(newDriver);
                                    tier.addDriver(newDriver);
                                    newDriver.save();
                                } else {
                                    driver.team.removeDriver(driver.id);
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
                                    if (index === team.drivers.last().id) {
                                        embed.setDescription(driverList);
                                        resolve();
                                    }
                                });
                                if (team.drivers.size === 0) {
                                    resolve();
                                }
                            });
                            promise.then(async () => {
                                message.channel.send(embed);
                                team.save();
                                server.getAttendanceManager().getAdvancedEvents().forEach(async event => {
                                    if (event.tier === tier) {
                                        const lastField = event.embed.fields[event.embed.fields.length - 1];
                                        const lastFieldTeam = tier.getTeam(lastField.name);
                                        const driverNames = [];
                                        team.drivers.forEach(d => {
                                            driverNames.push(`${AttendanceManager.unknown} ${d.member}`);
                                        });
                                        if (team.drivers.size === 0) {
                                            driverNames.push('-');
                                        }
                                        if (lastFieldTeam) {
                                            event.embed.addField(team.name, driverNames.join('\n'), false);
                                        } else {
                                            const newField = {
                                                name: team.name,
                                                value: driverNames.join('\n'),
                                                inline: false,
                                            };
                                            event.embed.fields.splice(event.embed.fields.length - 1, 0, newField);
                                        }
                                        event.edit();
                                    }
                                });
                                server.log(`${message.member.user.tag} has created team ${team.name} under ${tier.name}`, driverList);
                            });
                        });
                    }
                }
            });
        }
    }
};