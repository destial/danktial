const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const AttendanceManager = require('../managers/AttendanceManager');
const isStaff = require('../utils/isStaff');
const AdvancedAttendance = require('../items/AdvancedAttendance');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (reaction.partial) {
                try {
                    reaction = await reaction.fetch();
                } catch (err) {
                    console.log(err);
                }
            }
            if (user.bot) return;
            if (!reaction.message.guild) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetchAdvanced(reaction.message.id);
                if (attendance) {
                    var driver = attendance.tier.getDriver(user.id);
                    if (!driver) {
                        driver = attendance.tier.getReserve(user.id);
                    }
                    if (driver) {
                        switch (reaction.emoji.name) {
                            case AttendanceManager.accept:
                                await attendance.accept(driver);
                                break;
                            case AttendanceManager.reject:
                                await attendance.reject(driver);
                                break;
                            case AttendanceManager.tentative:
                                await attendance.maybe(driver);
                                break;
                            case AttendanceManager.delete:
                                if (isStaff(driver.member)) {
                                    await server.getAttendanceManager().awaitDeleteAdvancedAttendance(reaction, user);
                                }
                                break;
                            case AdvancedAttendance.editEmoji:
                                if (isStaff(driver.member)) {
                                    await server.getAttendanceManager().editAdvancedAttendance(driver.member);
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    await reaction.users.remove(user);
                }
            }
        });

        client.on('messageDelete', async message => {
            if (message.partial) {
                try {
                    message = await message.fetch();
                } catch(err) {
                    console.log('[ERROR] Something happened while fetching uncached deleted messages!');
                }
            }
            if (!message.author.bot) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetchAdvanced(message.id);
                if (attendance) {
                    await attendance.delete();
                }
            }
        });

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.partial) {
                try {
                    oldMember = await oldMember.fetch();
                } catch(err) {
                    console.log(err);
                }
            }
            if (oldMember.user.username !== newMember.user.username) {
                const server = await servers.fetch(newMember.guild.id);
                if (server) {
                    
                }
            }
        });
    }
};