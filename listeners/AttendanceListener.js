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
    }

};