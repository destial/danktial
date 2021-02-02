const Database = require('../database/Database');
const AttendanceManager= require('../managers/AttendanceManager');
const TicketManager = require('../managers/TicketManager');

const Discord = require('discord.js');

class Ticket {
    /**
     * 
     * @param {Discord.GuildMember} member 
     * @param {number} number 
     * @param {Discord.TextChannel} channel 
     * @param {Discord.Message} base
     * @param {TicketManager} ticketManager
     */
    constructor(member, number, channel, base, ticketManager) {
        this.ticketManager = ticketManager;
        this.id = channel.id;
        this.member = member;
        this.number = number;
        this.channel = channel;
        this.base = base;
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     */
    async addUser(member) {
        await this.channel.edit({
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES']
                }
            ]
        });
        await this.channel.send(new Discord.MessageEmbed()
            .setAuthor(`Added ${member.user.tag} to this ticket!`)
            .setColor('GREEN'));
        await this.ticketManager.server.log(`Added ${member.user.tag} to ticket ${this.channel.name}`);
    }

    /**
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.GuildMember} member 
     */
    async awaitCloseR(reaction, member) {
        return new Promise(async (resolve, reject) => {
            if (reaction.message.id === this.base.id) {
                try {
                    const a = await this.base.react(AttendanceManager.accept);
                    const b = await this.base.react(AttendanceManager.reject);
                    reaction.users.remove(member.user);
                    let filter = (r, u) => (u.id === member.id && 
                                            r.message.id === this.base.id && 
                                            (r.emoji.name === AttendanceManager.accept || r.emoji.name === AttendanceManager.reject));

                    const collector = this.base.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.once('collect', async (r, u) => {
                        if (r.emoji.name === AttendanceManager.accept) {
                            yesdelete = true;
                        }
                        collector.stop();
                    });
                    collector.once('end', async (collected) => {
                        if (yesdelete) {
                            await this.close(member);
                            resolve(true);
                        } else {
                            await a.remove();
                            await b.remove();
                            resolve(false);
                        }
                    });
                } catch (err) {
                    console.log(err);
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }

    /**
     * @param {Discord.Message} message
     * @param {Discord.GuildMember} member 
     */
    async awaitCloseC(message, member) {
        return new Promise(async (resolve, reject) => {
            if (message.channel.id === this.channel.id) {
                try {
                    const a = await message.react(AttendanceManager.accept);
                    const b = await message.react(AttendanceManager.reject);
                    let filter = (r, u) => (u.id === member.id && 
                                            r.message.id === message.id && 
                                            (r.emoji.name === AttendanceManager.accept || r.emoji.name === AttendanceManager.reject));

                    const collector = message.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.once('collect', async (r, u) => {
                        if (r.emoji.name === AttendanceManager.accept) {
                            yesdelete = true;
                        }
                        collector.stop();
                    });
                    collector.once('end', async (collected) => {
                        if (yesdelete) {
                            await this.close(member);
                            resolve(true);
                        } else {
                            await a.remove();
                            await b.remove();
                            await message.delete();
                            resolve(false);
                        }
                    });
                } catch (err) {
                    console.log(err);
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member
     * @returns {Promise<boolean>}
     */
    async close(member) {
        return new Promise(async (resolve, reject) => {
            try {
                const embed = new Discord.MessageEmbed()
                    .setAuthor('This ticket will close in 5 seconds!')
                    .setColor('RED');
                await this.channel.send(embed);
                setTimeout(async () => {
                    await this.channel.delete();
                    if (this.ticketManager.server.modlog) {
                        if (this.ticketManager.server.modlog) {
                            this.ticketManager.server.modlog.send(new Discord.MessageEmbed()
                                .setAuthor(`${member.displayName} has closed ${this.channel.name} by ${this.member.displayName}`)
                                .setTimestamp()
                                .setColor('RED'));
                        }
                    }
                    await Database.run(Database.ticketDeleteQuery, [this.id]);
                    console.log(`[TICKET] ${member.displayName} has closed ${this.channel.name} by ${this.member.displayName}`);
                    this.ticketManager.opentickets.delete(this.id);
                    resolve(true);
                }, 5000);
            } catch (err) {
                console.log(err);
                resolve(false);
            }
        });
    }

    async save() {
        await Database.run(Database.ticketSaveQuery, this.id, this.member.id, this.number, this.base.id);
        console.log(`[TICKET] Created new ticket ${this.number}`);
    }
}

module.exports = Ticket;