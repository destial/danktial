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
    description: 'Adds a driver to an existing tier',
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
                        const team = tier.getTeam(teamName.toLowerCase());
                        if (driverNumber) {
                            if (team) {
                                const driver = tier.getDriver(id);
                                const reserve = tier.getReserve(id);
                                if (driver) {
                                    if (driver.number !== String(driverNumber)) {
                                        driver.updateNumber(String(driverNumber));
                                    }
                                    driver.setNumber(String(driverNumber));
                                    driver.team.removeDriver(id);
                                    driver.setTeam(team);
                                    driver.setTier(tier);
                                    team.setDriver(driver);
                                    await driver.update();
                                } else if (reserve) {
                                    const toDriver = reserve.toDriver();
                                    if (toDriver.number !== String(driverNumber)) {
                                        toDriver.updateNumber(String(driverNumber));
                                    }
                                    toDriver.setNumber(driverNumber);
                                    toDriver.setTeam(team);
                                    toDriver.setTier(tier);
                                    team.setDriver(toDriver);
                                    tier.addDriver(toDriver);
                                    await toDriver.update();
                                } else {
                                    const newDriver = new Driver(client, member, server, team, driverNumber, tier);
                                    tier.addDriver(newDriver);
                                    team.setDriver(newDriver);
                                    newDriver.setTeam(team);
                                    await newDriver.save();
                                }
                                embed.setAuthor(`Successfully set ${member.user.tag} as part of team ${team.name} in tier ${tier.name}`);
                                message.channel.send(embed);
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