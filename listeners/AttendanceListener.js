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
                    reaction = await reaction.fetch();
                } catch (err) {
                    console.log(err);
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
                            await reaction.message.edit(attendance.accept(user));
                            break;
                        case AttendanceManager.reject:
                            await reaction.message.edit(attendance.reject(user));
                            break;
                        case AttendanceManager.tentative:
                            await reaction.message.edit(attendance.maybe(user));
                            break;
                        case AttendanceManager.delete:
                            const member = await server.guild.members.fetch(user.id);
                            if (member && isStaff(member)) {
                                await server.getAttendanceManager().awaitDeleteAttendance(reaction, user);
                            }
                            break;
                        default:
                            break;
                    }
                    await reaction.users.remove(user);
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (message.author.bot) return;
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
                        if (attendance.accepted.get(oldMember.user.username)) {
                            attendance.accepted.delete(oldMember.user.username);
                            attendance.accept(newMember.user);
                            await attendance.message.edit(attendance.embed);
                        } else if (attendance.rejected.get(oldMember.user.username)) {
                            attendance.rejected.delete(oldMember.user.username);
                            attendance.reject(newMember.user);
                            await attendance.message.edit(attendance.embed);
                        } else if (attendance.tentative.get(oldMember.user.username)) {
                            attendance.tentative.delete(oldMember.user.username);
                            attendance.maybe(newMember.user);
                            await attendance.message.edit(attendance.embed);
                        }
                    });
                }
            }
        });
    }
};