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
                try {
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
                                default:
                                    break;
                            }
                        }
                        await reaction.users.remove(user);
                    }
                } catch(err) {
                    console.log(err);
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
                }
            }
        });
    }
};