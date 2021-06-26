const Discord = require('discord.js');
const Driver = require('../items/Driver');
const Reserve = require('../items/Reserve');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');
const parseQuotations = require('../utils/parseQuotations');

module.exports = {
    name: 'setdriver',
    aliases: ['set-driver', 'setupdriver'],
    usage: '[ @driver "driver number" "tier name" "team name" ]',
    example: '@destiall "81" "Tier 1" "Alfa Romeo Sauber F1"',
    description: 'Adds a driver/reserve to an existing tier',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            try {
                const embed = new Discord.MessageEmbed();
                embed.setColor('RED');
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                    embed.setFooter(this.description);
                    await message.channel.send(embed);
                    return;
                }
                args.shift();
                //const id = arg1.replace('<@', '').replace('>', '').replace('!', '');
                //const member = await server.guild.members.fetch(id);
                const member = message.mentions.members.first()
                if (member) {
                    var str = args.join(" ");
                    var arguments = parseQuotations(str);
                    if (arguments.length < 3) {
                        embed.setAuthor('Usage is:');
                        embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                        embed.setFooter(this.description);
                        await message.channel.send(embed);
                        return;
                    }
                    const tierName = arguments[1];
                    const driverNumber = parseInt(arguments[0]);
                    const teamName = arguments[2];
                    const tier = server.getTierManager().getTier(tierName.toLowerCase());
                    if (tier) {
                        const teamCol = tier.searchTeam(teamName.toLowerCase());
                        if (driverNumber) {
                            const reserve = tier.getReserve(member.id);
                            const driver = tier.getDriver(member.id);
                            if (teamCol.size === 1) {
                                const team = teamCol.first();
                                if (reserve && team) {
                                    reserve.setTier(tier);
                                    team.setDriver(reserve);
                                    tier.addDriver(reserve);
                                    tier.removeReserve(reserve.id);
                                    if (reserve.number != String(driverNumber)) {
                                        await reserve.updateNum(String(driverNumber));
                                    }
                                    reserve.toDriver(team);
                                } else if (driver && team) {
                                    if (driver.number != String(driverNumber)) {
                                        await driver.updateNum(String(driverNumber));
                                    }
                                    driver.setNumber(String(driverNumber));
                                    if (driver.team) {
                                        driver.team.removeDriver(member.id);
                                    }
                                    driver.setTeam(team);
                                    driver.setTier(tier);
                                    team.setDriver(driver);
                                    await driver.update();
                                } else if (team) {
                                    const newDriver = new Driver(client, member, server, team, driverNumber, tier);
                                    tier.addDriver(newDriver);
                                    team.setDriver(newDriver);
                                    newDriver.setTeam(team);
                                    await newDriver.save();
                                }
                                embed.setAuthor(`Successfully set ${member.user.tag} as part of team ${team.name} in tier ${tier.name}`);
                                message.channel.send(embed);
                                await server.log(`${message.member.user.tag} has set ${member.user.tag} as part of ${team.name} in tier ${tier.name}`);
                                server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                                    await advanced.fix();
                                });
                                server.save();
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
                            } else if (teamName.toLowerCase().includes('reserve')) {
                                if (reserve) {
                                    if (reserve.number != String(driverNumber)) {
                                        reserve.updateNumber(String(driverNumber));
                                    }
                                    reserve.setNumber(String(driverNumber));
                                    await reserve.updateReserve();
                                } else if (driver) {
                                    if (driver.team) {
                                        driver.team.removeDriver(driver.id);
                                        tier.addReserve(driver);
                                    }
                                    tier.removeDriver(driver.id);
                                    if (driver.number != String(driverNumber)) {
                                        await driver.updateNum(String(driverNumber));
                                    }
                                    driver.toReserve();
                                } else {
                                    const newReserve = new Reserve(client, member, server, String(driverNumber), tier);
                                    tier.addReserve(newReserve);
                                    await newReserve.save();
                                }
                                embed.setAuthor(`Successfully set ${member.user.tag} as a reserve in tier ${tier.name}`);
                                message.channel.send(embed);
                                await server.log(`${message.member.user.tag} has set ${member.user.tag} as a reserve in tier ${tier.name}`);
                                server.getAttendanceManager().getAdvancedEvents().forEach(async advanced => {
                                    if (advanced.tier.name === tier.name)
                                        await advanced.fix();
                                });
                                server.save();
                            } else {
                                embed.setAuthor(`${teamName} is not a valid team! Usage is:`);
                                embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                                await message.channel.send(embed);
                                return;
                            }
                        } else {
                            embed.setAuthor(`${driverNumber} is not a valid number! Usage is:`);
                            embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                            await message.channel.send(embed);
                            return;
                        }
                    } else {
                        embed.setAuthor(`${tierName} is not a valid tier! Usage is:`);
                        embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                        await message.channel.send(embed);
                        return;
                    }
                } else {
                    embed.setAuthor(`No user was tagged! Usage is:`);
                    embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                    await message.channel.send(embed);
                    return;
                }
            } catch(err) {
                console.log(err);
                const embed = new Discord.MessageEmbed();
                embed.setAuthor(`Error, ${err}! Usage is:`);
                embed.setColor('RED');
                embed.setDescription(`${server.prefix}${command} ${this.usage}\nE.g. ${server.prefix}${command} ${this.example}`);
                await message.channel.send(embed);
                return;
            }
        }
    }
};