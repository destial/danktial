const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');
const AttendanceManager = require('../managers/AttendanceManager');
const isStaff = require('../utils/isStaff');

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
                    console.log(`[ATTENDANCE] Something happened while trying to cache uncached message reactions on add!`);
                }
            }
            if (user.bot) return;
            if (!reaction.message.guild) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetch(reaction.message.id);
                if (attendance) {
                    switch (reaction.emoji.name) {
                        case AttendanceManager.accept:
                            reaction.message.edit(attendance.accept(user));
                            break;
                        case AttendanceManager.reject:
                            reaction.message.edit(attendance.reject(user));
                            break;
                        case AttendanceManager.tentative:
                            reaction.message.edit(attendance.maybe(user));
                            break;
                        case AttendanceManager.delete:
                            const member = await server.guild.members.fetch(user.id);
                            if (member && isStaff(member)) {
                                server.getAttendanceManager().awaitDeleteAttendance(reaction, user);
                            }
                            break;
                        default:
                            break;
                    }
                    reaction.users.remove(user);
                }
            }
        });

        client.on('messageReactionRemove', async (reaction, user) => {
            if (!reaction.message.guild) return;
            if (user.bot) {
                const server = await servers.fetch(reaction.message.guild.id);
                if (server) {
                    const attendance = server.getAttendanceManager().fetch(reaction.message.id);
                    if (attendance) {
                        attendance.message.reactions.removeAll().then(async () => {
                            await attendance.message.react(AttendanceManager.accept);
                            await attendance.message.react(AttendanceManager.reject);
                            await attendance.message.react(AttendanceManager.tentative);
                            await attendance.message.react(AttendanceManager.delete);
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
                    console.log(`[ATTENDANCE] Something happened while trying to cache uncached message reactions on remove all!`);
                }
            }
            if (!message.guild) return;
            if (!message.author) return;
            if (!message.author.bot) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetch(message.id);
                if (attendance) {
                    await attendance.message.react(AttendanceManager.accept);
                    await attendance.message.react(AttendanceManager.reject);
                    await attendance.message.react(AttendanceManager.tentative);
                    await attendance.message.react(AttendanceManager.delete);
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (!message.author.bot) return;
            if (!message.guild) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetch(message.id);
                if (attendance) {
                    await attendance.delete();
                }
            }
        });

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.user.username !== newMember.user.username) {
                const server = await servers.fetch(newMember.guild.id);
                if (server) {
                    server.getAttendanceManager().getEvents().forEach(async attendance => {
                        if (attendance.accepted.get(oldMember.id)) {
                            attendance.accepted.delete(oldMember.id);
                            attendance.accept(newMember.user);
                            await attendance.message.edit(attendance.embed);

                        } else if (attendance.rejected.get(oldMember.id)) {
                            attendance.rejected.delete(oldMember.id);
                            attendance.reject(newMember.user);
                            await attendance.message.edit(attendance.embed);

                        } else if (attendance.tentative.get(oldMember.id)) {
                            attendance.tentative.delete(oldMember.id);
                            attendance.maybe(newMember.user);
                            await attendance.message.edit(attendance.embed);
                        }
                    });
                }
            }
        });

        client.on('guildMemberRemove', async (member) => {
            const server = await servers.fetch(member.guild.id);
            if (server) {
                server.getAttendanceManager().getEvents().forEach(async attendance => {
                    attendance.accepted.delete(member.id);
                    attendance.rejected.delete(member.id);
                    attendance.tentative.delete(member.id);
                    attendance.edit();
                });
            }
        });
    }
};