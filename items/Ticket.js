const Database = require('../database/Database');
const AttendanceManager= require('../managers/AttendanceManager');
const TicketManager = require('../managers/TicketManager');

const Discord = require('discord.js');
const { Logger } = require('../utils/Utils');

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
        this.guild = channel.guild;
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
        this.channel.send(new Discord.MessageEmbed()
            .setAuthor(`Added ${member.user.tag} to this ticket!`)
            .setColor('GREEN'));
        this.ticketManager.server.log(`Added ${member.user.tag} to ticket ${this.channel.name}`);
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
                            this.close(member);
                            resolve(true);
                        } else {
                            a.remove();
                            b.remove();
                            resolve(false);
                        }
                    });
                } catch (err) {
                    this.ticketManager.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
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
                             this.close(member);
                            resolve(true);
                        } else {
                            a.remove();
                            b.remove();
                            message.delete();
                            resolve(false);
                        }
                    });
                } catch (err) {
                    this.ticketManager.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
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
                    this.channel.delete();
                    if (this.ticketManager.server.modlog) {
                        if (this.ticketManager.server.modlog) {
                            this.ticketManager.server.modlog.send(new Discord.MessageEmbed()
                                .setAuthor(`${member.displayName} has closed ${this.channel.name} by ${this.member.displayName}`)
                                .setTimestamp()
                                .setColor('RED'));
                        }
                    }
                    Database.run(Database.ticketDeleteQuery, [this.id]);
                    this.ticketManager.opentickets.delete(this.id);
                    this.ticketManager.server.update();
                    this.ticketManager.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[TICKET] ${member.displayName} has closed ${this.channel.name} by ${this.member.displayName}`);
                }, 5000);
            } catch (err) {
                this.ticketManager.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                resolve(false);
            }
        });
    }

    async save() {
        Database.run(Database.ticketSaveQuery, this.id, this.member.id, this.number, this.base.id);
        this.server.update();
        Logger.info(`[TICKET] Created new ticket ${this.number}`);
    }

    async loadJSON(object) {
        
    }

    toJSON() {
        return {
            id: this.id,
            guild: this.channel.guild.id,
            member: this.member.id,
            number: this.number,
            base: this.base.id
        };
    }

    toString() {
        return `${this.channel}`;
    }
}

module.exports = Ticket;