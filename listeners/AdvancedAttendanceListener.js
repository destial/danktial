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
                    if (driver && !attendance.isLocked()) {
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
                            default:
                                break;
                        }
                    }
                    try {
                        const member = await reaction.message.guild.members.fetch(user.id);
                        if (isStaff(member)) {
                            switch (reaction.emoji.name) {
                                case AttendanceManager.delete:
                                    await server.getAttendanceManager().awaitDeleteAdvancedAttendance(reaction, user);
                                    break;
                                case AdvancedAttendance.editEmoji:
                                    await server.getAttendanceManager().editAdvancedAttendance(driver.member, attendance);
                                    break;
                                case AdvancedAttendance.lockEmoji:
                                    if (!attendance.isLocked()) {
                                        attendance.setLocked(true);
                                        attendance.message.reactions.removeAll();
                                    }
                                    break;
                                case AdvancedAttendance.unlockEmoji:
                                    if (attendance.isLocked()) {
                                        attendance.setLocked(false);
                                        attendance.message.reactions.removeAll();
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    } catch(err) {
                        console.log(`[ERROR] Missing member ${user.id}`);
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
                            if (!attendance.isLocked()) {
                                await attendance.message.react(AttendanceManager.accept);
                                await attendance.message.react(AttendanceManager.reject);
                                await attendance.message.react(AttendanceManager.tentative);
                            }
                            await attendance.message.react(AttendanceManager.delete);
                            await attendance.message.react(AdvancedAttendance.editEmoji);
                            if (!attendance.isLocked()) {
                                await attendance.message.react(AdvancedAttendance.lockEmoji);
                            } else {
                                await attendance.message.react(AdvancedAttendance.unlockEmoji);
                            }
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
                    console.log(`[ADVANCEDATTENDANCE] Something happened while trying to cache uncached message reactions on remove all!`);
                }
            }
            if (!message.guild) return;
            if (!message.author) return;
            if (!message.author.bot) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetchAdvanced(message.id);
                if (attendance) {
                    if (!attendance.isLocked()) {
                        await attendance.message.react(AttendanceManager.accept);
                        await attendance.message.react(AttendanceManager.reject);
                        await attendance.message.react(AttendanceManager.tentative);
                    }
                    await attendance.message.react(AttendanceManager.delete);
                    await attendance.message.react(AdvancedAttendance.editEmoji);
                    if (!attendance.isLocked()) {
                        await attendance.message.react(AdvancedAttendance.lockEmoji);
                    } else {
                        await attendance.message.react(AdvancedAttendance.unlockEmoji);
                    }
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (!message.author.bot) return;
            if (!message.guild) return;
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