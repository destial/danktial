const Discord = require('discord.js');
const Database = require('../database/Database');
const Driver = require('../items/Driver');
const Reserve = require('../items/Reserve');
const Server = require('../items/Server');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'setdriver',
    aliases: ['set-driver', 'setupdriver'],
    usage: '[ @driver "driver number" "tier name" "team name" ]',
    example: '@destiall "81" "Tier 1" "Alpha Romeo Sauber F1"',
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
                if (!args.length) {
                    embed.setAuthor('Usage is:');
                    embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                    await message.channel.send(embed);
                    return;
                }
                const arg1 = args.shift();
                const id = arg1.replace('<@', '').replace('>', '').replace('!', '');
                const member = await server.guild.members.fetch(id);
                if (member) {
                    var str = args.join(" ");
                    var arguments = [];
                    while (true) {
                        var num = str.indexOf('"');
                        if (num === -1) break;
                        str = str.substring(num+1);
                        num = str.indexOf('"');
                        const arg = str.substring(0, num);
                        if (arg === " " || arg === "") continue;
                        arguments.push(arg);
                    }
                    if (arguments.length < 3) {
                        embed.setAuthor('Usage is:');
                        embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
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
                            const driver = tier.getDriver(id);
                            const reserve = tier.getReserve(id);
                            if (teamCol.size === 1) {
                                const team = teamCol.first();
                                if (driver && team) {
                                    if (driver.number != String(driverNumber)) {
                                        await driver.updateNumber(String(driverNumber));
                                    }
                                    driver.setNumber(String(driverNumber));
                                    driver.team.removeDriver(id);
                                    driver.setTeam(team);
                                    driver.setTier(tier);
                                    team.setDriver(driver);
                                    await driver.update();
                                    //console.log('driver exist');
                                } else if (reserve && team) {
                                    reserve.toDriver(team);
                                    if (reserve.number != String(driverNumber)) {
                                        await reserve.updateNum(String(driverNumber));
                                    }
                                    reserve.setTier(tier);
                                    team.setDriver(reserve);
                                    tier.addDriver(reserve);
                                    tier.removeReserve(reserve.id);
                                    await reserve.update();
                                    //console.log('reserve exist');
                                } else if (team) {
                                    const newDriver = new Driver(client, member, server, team, driverNumber, tier);
                                    tier.addDriver(newDriver);
                                    team.setDriver(newDriver);
                                    newDriver.setTeam(team);
                                    await newDriver.save();
                                    //console.log('new driver');
                                }
                                embed.setAuthor(`Successfully set ${member.user.tag} as part of team ${team.name} in tier ${tier.name}`);
                                message.channel.send(embed);
                                server.log(`${message.member.user.tag} has set ${member.user.tag} as part of ${team.name} in tier ${tier.name}`);
                            } else if (teamCol.size > 1) {
                                const embed5 = new Discord.MessageEmbed();
                                embed5.setAuthor('Team name was found in many instances! Try to use the exact name!');
                                var teamList = '';
                                teamCol.forEach(team => {
                                    teamList += `- ${team.name}\n`;
                                });
                                embed5.setDescription(teamList);
                                message.channel.send(embed5);
                            } else if (teamName.toLowerCase().includes('reserve')) {
                                //console.log(driver);
                                if (driver) {
                                    driver.setTier(tier);
                                    driver.team.removeDriver(driver.id);
                                    tier.addReserve(driver);
                                    tier.removeDriver(driver.id);
                                    driver.toReserve();
                                    if (driver.number != String(driverNumber)) {
                                        await driver.updateNum(String(driverNumber));
                                    }
                                    //await driver.update();
                                    //console.log('reserve driver exist');
                                } else if (reserve) {
                                    if (reserve.number != String(driverNumber)) {
                                        reserve.updateNumber(String(driverNumber));
                                    }
                                    reserve.setNumber(String(driverNumber));
                                    reserve.setTier(tier);
                                    await reserve.updateReserve();
                                    //console.log('reserve reserve exist');
                                } else {
                                    const newReserve = new Reserve(client, member, server, String(driverNumber), tier);
                                    tier.addReserve(newReserve);
                                    await newReserve.save();
                                    //console.log('new reserve');
                                }
                                embed.setAuthor(`Successfully set ${member.user.tag} as a reserve in tier ${tier.name}`);
                                message.channel.send(embed);
                                server.log(`${message.member.user.tag} has set ${member.user.tag} as a reserve in tier ${tier.name}`);

                            } else {
                                embed.setAuthor(`${teamName} is not a valid team! Usage is:`);
                                embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                                await message.channel.send(embed);
                                return;
                            }
                        } else {
                            embed.setAuthor(`${driverNumber} is not a valid number! Usage is:`);
                            embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                            await message.channel.send(embed);
                            return;
                        }
                    } else {
                        embed.setAuthor(`${tierName} is not a valid tier! Usage is:`);
                        embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                        await message.channel.send(embed);
                        return;
                    }
                } else {
                    embed.setAuthor(`${arg1} is not a valid member! Usage is:`);
                    embed.setDescription(`${server.prefix}${this.name} ${this.usage}\nE.g. ${server.prefix}${this.name} ${this.example}`);
                    await message.channel.send(embed);
                    return;
                }
            } catch(err) {
                console.log(err);
            }
        }
    }
};