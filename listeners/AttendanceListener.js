const AttendanceManager = require('../managers/AttendanceManager');
const isStaff = require('../utils/isStaff');

module.exports = {
    async run(client, servers) {
        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return;
            if (!reaction.message.guild) return;
            const server = await servers.fetch(reaction.message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetch(reaction.message.id);
                if (attendance) {
                    switch (reaction.emoji.name) {
                        case AttendanceManager.accept:
                            attendance.message.edit(attendance.accept(user));
                            break;
                        case AttendanceManager.reject:
                            attendance.message.edit(attendance.reject(user));
                            break;
                        case AttendanceManager.tentative:
                            attendance.message.edit(attendance.maybe(user));
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
                            attendance.message.react(AttendanceManager.accept).then(async () => {
                                await attendance.message.react(AttendanceManager.reject);
                                await attendance.message.react(AttendanceManager.tentative);
                                await attendance.message.react(AttendanceManager.delete);
                            });
                        });
                    }
                }
            }
        });

        client.on('messageReactionRemoveAll', async (message) => {
            if (!message.guild) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                const attendance = server.getAttendanceManager().fetch(message.id);
                if (attendance) {
                    attendance.message.react(AttendanceManager.accept).then(async () => {
                        await attendance.message.react(AttendanceManager.reject);
                        await attendance.message.react(AttendanceManager.tentative);
                        await attendance.message.react(AttendanceManager.delete);
                    });
                }
            }
        });

        client.on('messageDelete', async message => {
            if (!message.author) return;
            if (!message.author.bot) return
            if (!message.guild) return;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                server.getAttendanceManager().deleteAttendance(message);
            }
        });

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.user.username !== newMember.user.username) {
                const server = await servers.fetch(newMember.guild.id);
                if (server) {
                    for (const attendance of server.getAttendanceManager().getEvents().values() ) {
                        if (attendance.accepted.get(oldMember.id)) {
                            attendance.accepted.delete(oldMember.id);
                            attendance.message.edit(attendance.accept(newMember.user));

                        } else if (attendance.rejected.get(oldMember.id)) {
                            attendance.rejected.delete(oldMember.id);
                            attendance.message.edit(attendance.reject(newMember.user));

                        } else if (attendance.tentative.get(oldMember.id)) {
                            attendance.tentative.delete(oldMember.id);
                            attendance.message.edit(attendance.maybe(newMember.user));
                        }
                    }
                }
            }
        });

        client.on('guildMemberRemove', async (member) => {
            const server = await servers.fetch(member.guild.id);
            if (server) {
                for (const attendance of server.getAttendanceManager().getEvents().values() ) {
                    attendance.accepted.delete(member.id);
                    attendance.rejected.delete(member.id);
                    attendance.tentative.delete(member.id);
                    attendance.edit();
                }
            }
        });
    }
};