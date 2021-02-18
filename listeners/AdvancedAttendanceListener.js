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
                    await reaction.fetch();
                } catch (err) {
                    console.log(`[ADVANCEDATTENDANCE] Something happened while trying to cache uncached message reactions on add!`);
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
                                    await server.getAttendanceManager().editAdvancedAttendance(driver.member, attendance);
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

        client.on('messageReactionRemove', async (reaction, user) => {
            if (!reaction.message.guild) return;
            if (user.bot) {
                const server = await servers.fetch(reaction.message.guild.id);
                if (server) {
                    const attendance = server.getAttendanceManager().fetchAdvanced(reaction.message.id);
                    if (attendance) {
                        attendance.message.reactions.removeAll().then(async () => {
                            await attendance.message.react(AttendanceManager.accept);
                            await attendance.message.react(AttendanceManager.reject);
                            await attendance.message.react(AttendanceManager.tentative);
                            await attendance.message.react(AttendanceManager.delete);
                            await attendance.message.react(AdvancedAttendance.editEmoji);
                        });
                    }
                }
            }
        });

        client.on('messageReactionRemoveAll', async (message) => {
            if (message.partial) {
                try {
                    await message.fetch();
                } catch(err) {
                    console.log(`[ADVANCEDATTENDANCE] Something happened while trying to cache uncached message reactions on remove!`);
                }
            }
            if (!message.guild) return;
            if (!message.author) return;
            if (!message.author.bot) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetchAdvanced(message.id);
                if (attendance) {
                    await attendance.message.react(AttendanceManager.accept);
                    await attendance.message.react(AttendanceManager.reject);
                    await attendance.message.react(AttendanceManager.tentative);
                    await attendance.message.react(AttendanceManager.delete);
                    await attendance.message.react(AdvancedAttendance.editEmoji);
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (message.author.bot) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetchAdvanced(message.id);
                if (attendance) {
                    await attendance.delete();
                    server.getAttendanceManager().getAdvancedEvents().delete(attendance.id);
                }
            }
        });
    }
};