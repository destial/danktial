const Discord = require('discord.js');
const Database = require('../database/Database');
const Attendance = require('../items/Attendance');
const AdvancedAttendance = require('../items/AdvancedAttendance');
const Server = require('../items/Server');
const formatDate = require('../utils/formatDate');
const formatFormalTime = require('../utils/formatFormatTime');
const Tier = require('../items/Tier');
const formatTrack = require('../utils/formatTrack');

class AttendanceManager {
    /**
     * @param {Discord.Client} client
     * @param {Server} server 
     */
    constructor(client, server) {
        /**
         * @type {Discord.Collection<string, Attendance>}
         * @private
         */
        this.events = new Discord.Collection();

        /**
         * @type {Discord.Collection<string, AdvancedAttendance>}
         * @private
         */
        this.advancedEvents = new Discord.Collection();
        this.server = server;
        this.client = client;
    }

    static get accept() { return "✅"; }
    static get reject() { return "❌"; }
    static get tentative() { return "❔"; }
    static get delete() { return "🗑️"; }

    /**
     * @param {Discord.Client} client
     * @param {Discord.GuildMember} member 
     * @param {Server} server
     * @param {Discord.TextChannel} channel 
     * @returns {Promise<AdvancedAttendance>} 
     */
    async newAdvancedAttendance(client, server, member, channel) {
        const embed = new Discord.MessageEmbed();
        if (server.getTierManager().tiers.size === 0) {
            return new Promise(async (resolve, reject) => {
                embed.setAuthor(`You do not have any tiers! Please create a tier using ${server.prefix}addtier`);
                await channel.send(embed);
                resolve(undefined);
            });
        }
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const questions = [
                "What is the title of this event?",
                "What is the description of the event?",
                "What is the date of this event? Format should be: DD/MM/YYYY 20:30",
                "What is the timezone of the event? Reply with (AEDT / AEST / SGT)",
                "What is the tier of this event? Reply with the following:"
            ];
            const tierNames = [];
            server.getTierManager().tiers.forEach(tier => {
                tierNames.push("`" + tier.name + "`");
            });
            /**
             * @type {string}
             */
            var answers = [];
            const dateformat = "DD/MM/YYYY 20:30";

            embed.setAuthor(questions[counter++]);
            const dm = await member.user.send(embed);
            const filter = m => m.author.id === member.id;
            const collector = dm.channel.createMessageCollector(filter, {
                max: questions.length,
                time: 5*60000
            });

            collector.on('collect', async (message, col) => {
                if (counter < questions.length) {
                    embed.setAuthor(questions[counter++]);
                    if (counter === questions.length) {
                        embed.setDescription(tierNames.join('\n'));
                    } 
                    await member.user.send(embed);
                }
            });

            collector.on('end', async (collected) => {
                collected.forEach((collect) => {
                    answers.push(collect.content);
                });
                const title = answers[0];
                const description = answers[1];
                const date = answers[2];
                const timezone = answers[3];
                const tier = answers[4];
                const replyEmbed = new Discord.MessageEmbed();
                if (!title || !description || !date || !timezone || !tier) {
                    replyEmbed.setAuthor("Ran out of time!");
                    await member.user.send(replyEmbed);
                    resolve(undefined);
                } else if (date.length !== dateformat.length) {
                    replyEmbed.setAuthor("Invalid date! Formatting error! (DD/MM/YYYY 20:30)");
                    replyEmbed.setDescription(`E.g: 01/01/2021 10:45 or 20/04/2021 09:30`);
                    await member.user.send(embed);
                    resolve(undefined);
                } else if (!server.getTierManager().getTier(tier.toLowerCase())) {
                    replyEmbed.setAuthor("Tier is invalid! Did not match any tier of:");
                    replyEmbed.setDescription(tierNames.join('\n'));
                    await member.user.send(replyEmbed);
                    resolve(undefined);
                } else {
                    const t = server.getTierManager().getTier(tier.toLowerCase());
                    const attendanceembed = new Discord.MessageEmbed();
                    formatDate(`${date} ${timezone.toUpperCase()}`).then((dateObject) => {
                        const dateNow = new Date();
                        if (dateObject.getTime() < dateNow.getTime()) {
                            const difference = dateNow.getTime()-dateObject.getTime();
                            replyEmbed.setAuthor("Invalid date! Date cannot be in the past!");
                            replyEmbed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                            member.user.send(replyEmbed);
                            resolve();
                        } else {
                            const dateString = `${dateObject.toDateString()} ${formatFormalTime(dateObject, timezone.toUpperCase())}`;
                            attendanceembed.setTitle(title);
                            attendanceembed.setDescription(description);
                            if (formatTrack(title)) {
                                attendanceembed.setThumbnail(formatTrack(title));
                            } else if (formatTrack(description)) {
                                attendanceembed.setThumbnail(formatTrack(description));
                            }
                            attendanceembed.addFields(
                                { name: "Date & Time", value: dateString, inline: false }
                            );
                            t.teams.forEach(team => {
                                const driverNames = [];
                                team.drivers.array().forEach(d => {
                                    driverNames.push(`${AttendanceManager.tentative} ${d.member}`);
                                });
                                attendanceembed.addField(team.name, driverNames.join('\n'), false);
                            });
                            const reserveNames = [];
                            if (t.reserves.size !== 0) {
                                t.reserves.forEach(reserve => {
                                    reserveNames.push(`${AttendanceManager.tentative} ${reserve.member}`);
                                });
                                attendanceembed.addField('Reserves', reserveNames.join('\n'), false);
                            }
                            attendanceembed.setFooter(t.name);
                            attendanceembed.setTimestamp(dateObject);
                            attendanceembed.setColor('RANDOM');
                            channel.send(attendanceembed).then(async (m) => {
                                await m.react(AttendanceManager.accept);
                                await m.react(AttendanceManager.reject);
                                await m.react(AttendanceManager.tentative);
                                await m.react(AttendanceManager.delete);
                                await m.react(AdvancedAttendance.editEmoji);
                                replyEmbed.setAuthor(`Successfully created event ${title}`);
                                await member.user.send(replyEmbed);
                                const attendance = new AdvancedAttendance(client, m, server, t, dateObject, this);
                                this.advancedEvents.set(attendance.id, attendance);
                                try {
                                    await attendance.save();
                                    resolve(attendance);
                                } catch (err) {
                                    console.log(err);
                                    resolve(attendance);
                                }
                            });
                        }
                    }).catch(async (dateo) => {
                        replyEmbed.setAuthor(`There was an error while making an attendance! Perhaps there are no drivers in this tier?`);
                        await member.user.send(replyEmbed);
                        console.log(dateo);
                        resolve(undefined);
                    });
                }
            });
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @param {Discord.GuildChannel} channel 
     * @returns {Promise<Attendance>}
     */
    async newAttendance(member, channel) {
        const embed = new Discord.MessageEmbed();
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const questions = [
                "What is the title of this event?",
                "What is the description of the event?",
                "What is the date of this event? Format should be: DD/MM/YYYY 20:30",
                "What is the timezone of the event? Reply with (AEDT / AEST / SGT)"
            ];
            /**
             * @type {string[]}
             */
            var answers = [];
            const dateformat = "DD/MM/YYYY 20:30";

            embed.setAuthor(questions[counter++]);
            member.user.send(embed).then((dm) => {
                const filter = m => m.author.id === member.id;
                const collector = dm.channel.createMessageCollector(filter, {
                    max: questions.length,
                    time: 5*60000
                });
                collector.on('collect', async (message, col) => {
                    if (counter < questions.length) {
                        embed.setAuthor(questions[counter++]);
                        member.user.send(embed);
                    }
                });
                collector.on('end', async (collected) => {
                    collected.forEach((collect) => {
                        answers.push(collect.content);
                    });
                    const title = answers[0];
                    const description = answers[1];
                    const date = answers[2];
                    const timezone = answers[3];
                    if (!title || !description || !date || !timezone) {
                        embed.setAuthor("Ran out of time!");
                        member.user.send(embed);
                        resolve(undefined);
                    } else if (date.length !== dateformat.length) {
                        embed.setAuthor("Invalid date! Formatting error! (DD/MM/YYYY 20:30)");
                        embed.setDescription(`E.g: 01/01/2021 10:45 or 20/04/2021 09:30`);
                        member.user.send(embed);
                        resolve(undefined);
                    } else {
                        const attendanceembed = new Discord.MessageEmbed();
                        formatDate(`${date} ${timezone.toUpperCase()}`).then((dateObject) => {
                            const dateNow = new Date();
                            if (dateObject.getTime() < dateNow.getTime()) {
                                const difference = dateNow.getTime()-dateObject.getTime();
                                embed.setAuthor("Invalid date! Date cannot be in the past!");
                                embed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                                member.user.send(embed);
                                resolve();
                            } else {
                                const dateString = `${dateObject.toDateString()} ${formatFormalTime(dateObject, timezone.toUpperCase())}`;
                                attendanceembed.setTitle(title);
                                attendanceembed.setDescription(description);
                                if (formatTrack(title)) {
                                    attendanceembed.setThumbnail(formatTrack(title));
                                } else if (formatTrack(description)) {
                                    attendanceembed.setThumbnail(formatTrack(description));
                                }
                                attendanceembed.addFields(
                                    { name: "Date & Time", value: dateString, inline: false },
                                    { name: `${AttendanceManager.accept} Accepted (0)`, value: ">>> -", inline: true },
                                    { name: `${AttendanceManager.reject} Rejected (0)`, value: ">>> -", inline: true },
                                    { name: `${AttendanceManager.tentative} Tentative (0)`, value: ">>> -", inline: true }
                                );
                                attendanceembed.setFooter('Local Time');
                                attendanceembed.setTimestamp(dateObject);
                                attendanceembed.setColor('RANDOM');
                                channel.send(attendanceembed).then(async (m) => {
                                    await m.react(AttendanceManager.accept);
                                    await m.react(AttendanceManager.reject);
                                    await m.react(AttendanceManager.tentative);
                                    await m.react(AttendanceManager.delete);
                                    embed.setAuthor(`Successfully created event ${title}`);
                                    member.user.send(embed);
                                    const attendance = new Attendance(attendanceembed, m.id, dateObject, this.server.guild);
                                    this.events.set(attendance.id, attendance);
                                    try {
                                        await Database.run(Database.attendanceSaveQuery, [attendance.id, String(attendance.date.getTime()), channel.id]);
                                        console.log(`[UPDATE] Saved attendance ${attendance.title} of id ${attendance.id}`);
                                        resolve(attendance);
                                    } catch (err) {
                                        console.log(err);
                                        resolve(attendance);
                                    }
                                });
                            }
                        }).catch((err) => {
                            embed.setAuthor(`There was an error while making an attendance!`);
                            member.user.send(embed);
                            console.log(err);
                            resolve(undefined);
                        });
                    }
                });
            });
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member
     */
    async editAttendance(member) {
        const embed = new Discord.MessageEmbed();
        const allevents = []; const alleventsid = [];
        let counter = 0;
        this.events.forEach((event) => {
            allevents.push(`${counter++}: ${event.title}`);
            alleventsid.push(event.id);
        });
        if (!allevents.length) {
            embed.setAuthor("No events are upcoming at the moment!");
            member.user.send(embed);
            return;
        }
        embed.setAuthor("Select the event to edit:");
        embed.addFields(
            {name: 'Events', value: allevents.join('\n'), inline: true}
        );
        member.user.send(embed).then(async (dm) => {
            counter = 0;
            const dictionary = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🇦", "🇧","🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"];
            allevents.forEach(async (e) => {
                await dm.react(dictionary[counter++]);
            });
            let filter = r => r.message.id === dm.id;
            var collector = dm.createReactionCollector(filter, { time: 60000 });
            var editevent = "";
            collector.on('collect', async (reaction, user) => {
                if (!user.bot) {
                    editevent = reaction.emoji.name;
                    collector.stop();
                }
            });
            collector.on('end', async (collection1) => {
                const index = dictionary.indexOf(editevent);
                const attendanceevent = this.fetch(alleventsid[index]);
                member.user.send(attendanceevent.embed).then((em) => {
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setAuthor("Select the options to edit: (🇹 for title) (🇩 for description) (📆 for date)");
                    member.user.send(embed2).then(async (m) => {
                        await m.react("🇹");
                        await m.react("🇩");
                        await m.react("📆");
                        var emojiname = "";
                        let rfilter = r => r.message.id === m.id;
                        var rcollector = m.createReactionCollector(rfilter, {time: 60000, maxEmojis: 4});
                        rcollector.on('collect', async (reaction, user) => {
                            if (!user.bot) {
                                emojiname = reaction.emoji.name;
                                rcollector.stop();
                            }
                        });
                        rcollector.on('end', async (collection2) => {
                            if (emojiname === "🇹") {
                                embed2.setAuthor("Enter the new title:");
                            } else if (emojiname === "🇩") {
                                embed2.setAuthor("Enter the new description:");
                            } else if (emojiname === "📆") {
                                embed2.setAuthor("Enter the new date: (Format is DD/MM/YYYY 20:30 AEDT)");
                            }
                            member.user.send(embed2).then((m3) => {
                                let mfilter = m => m.author.id === member.id;
                                let mcollector = m3.channel.createMessageCollector(mfilter, {time: 60000});
                                mcollector.on('collect', async (message) => {
                                    /**
                                     * @type {string}
                                     */
                                    let edit = message.content;
                                    if (emojiname === "🇹") {
                                        attendanceevent.embed.setTitle(edit);
                                        attendanceevent.title = edit;
                                        mcollector.stop();
                                    } else if (emojiname === "🇩") {
                                        attendanceevent.embed.setDescription(edit);
                                        attendanceevent.description = edit;
                                        mcollector.stop();
                                    } else if (emojiname === "📆") {
                                        const dateNow = new Date();
                                        formatDate(edit).then((date) => {
                                            if (date.getTime() < dateNow.getTime()) {
                                                const difference = dateNow.getTime() - date.getTime();
                                                embed.setAuthor("Invalid date! Date cannot be in the past!");
                                                embed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                                                member.user.send(embed);
                                            } else {
                                                const dateString = `${date.toDateString()} ${formatFormalTime(date, edit.substring(edit.length-4, edit.length).trim())}`;
                                                mcollector.stop();
                                                attendanceevent.updateDate(date, dateString);
                                            }
                                        }).catch((err) => {
                                            embed2.setAuthor("Invalid date! Please try again! (Format is DD/MM/YYYY 20:30 AEDT)");
                                            member.user.send(embed2);
                                        });
                                    }
                                });
                                mcollector.on('end', async (mcollected) => {
                                    member.guild.channels.cache.forEach((ch) => {
                                        if (ch.isText() && ch.type === "text") {
                                            ch.messages.fetch(attendanceevent.id).then((editmessage) => {
                                                editmessage.edit(attendanceevent.embed).then(async (m5) => {
                                                    try {
                                                        await Database.run(Database.attendanceSaveQuery, [attendanceevent.id, String(attendanceevent.date.getTime()), ch.id]);
                                                        console.log(`[UPDATE] Edited attendance ${attendanceevent.title} of id: ${attendanceevent.id}`);
                                                        embed2.setAuthor("Successfully edited event!");
                                                        member.user.send(embed2);
                                                    } catch (err) {
                                                        console.log(err);
                                                    }
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member
     */
    async editAdvancedAttendance(member) {
        const embed = new Discord.MessageEmbed();
        const allevents = []; const alleventsid = [];
        let counter = 0;
        this.advancedEvents.forEach((event) => {
            allevents.push(`${counter++}: ${event.embed.title} (${event.tier.name})`);
            alleventsid.push(event.id);
        });
        if (!allevents.length) {
            embed.setAuthor("No events are upcoming at the moment!");
            member.user.send(embed);
            return;
        }
        embed.setAuthor("Select the event to edit:");
        embed.addFields(
            {name: 'Events', value: allevents.join('\n'), inline: true}
        );
        member.user.send(embed).then(async (dm) => {
            counter = 0;
            const dictionary = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🇦", "🇧","🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"];
            allevents.forEach(async (e) => {
                await dm.react(dictionary[counter++]);
            });
            let filter = r => r.message.id === dm.id;
            var collector = dm.createReactionCollector(filter, { time: 60000 });
            var editevent = "";
            collector.on('collect', async (reaction, user) => {
                if (!user.bot) {
                    editevent = reaction.emoji.name;
                    collector.stop();
                }
            });
            collector.on('end', async (collection1) => {
                const index = dictionary.indexOf(editevent);
                const attendanceevent = this.fetchAdvanced(alleventsid[index]);
                member.user.send(attendanceevent.embed).then((em) => {
                    const embed2 = new Discord.MessageEmbed();
                    embed2.setAuthor("Select the options to edit: (🇹 for title) (🇩 for description) (📆 for date)");
                    member.user.send(embed2).then(async (m) => {
                        await m.react("🇹");
                        await m.react("🇩");
                        await m.react("📆");
                        var emojiname = "";
                        let rfilter = r => r.message.id === m.id;
                        var rcollector = m.createReactionCollector(rfilter, {time: 60000, maxEmojis: 4});
                        rcollector.on('collect', async (reaction, user) => {
                            if (!user.bot) {
                                emojiname = reaction.emoji.name;
                                rcollector.stop();
                            }
                        });
                        rcollector.on('end', async (collection2) => {
                            if (emojiname === "🇹") {
                                embed2.setAuthor("Enter the new title:");
                            } else if (emojiname === "🇩") {
                                embed2.setAuthor("Enter the new description:");
                            } else if (emojiname === "📆") {
                                embed2.setAuthor("Enter the new date: (Format is DD/MM/YYYY 20:30 AEDT)");
                            }
                            member.user.send(embed2).then((m3) => {
                                let mfilter = m => m.author.id === member.id;
                                let mcollector = m3.channel.createMessageCollector(mfilter, {time: 60000});
                                mcollector.on('collect', async (message) => {
                                    /**
                                     * @type {string}
                                     */
                                    let edit = message.content;
                                    if (emojiname === "🇹") {
                                        attendanceevent.embed.setTitle(edit);
                                        mcollector.stop();
                                    } else if (emojiname === "🇩") {
                                        attendanceevent.embed.setDescription(edit);
                                        mcollector.stop();
                                    } else if (emojiname === "📆") {
                                        const dateNow = new Date();
                                        formatDate(edit).then((date) => {
                                            if (date.getTime() < dateNow.getTime()) {
                                                const difference = dateNow.getTime() - date.getTime();
                                                embed.setAuthor("Invalid date! Date cannot be in the past!");
                                                embed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                                                member.user.send(embed);
                                            } else {
                                                const dateString = `${date.toDateString()} ${formatFormalTime(date, edit.substring(edit.length-4, edit.length).trim())}`;
                                                attendanceevent.updateDate(date, dateString);
                                                mcollector.stop();
                                            }
                                        }).catch((err) => {
                                            embed2.setAuthor("Invalid date! Please try again! (Format is DD/MM/YYYY 20:30 AEDT)");
                                            member.user.send(embed2);
                                        });
                                    }
                                });
                                mcollector.on('end', async (mcollected) => {
                                    member.guild.channels.cache.forEach((ch) => {
                                        if (ch.isText() && ch.type === "text") {
                                            attendanceevent.message.edit(attendanceevent.embed).then(async (m5) => {
                                                try {
                                                    await attendanceevent.update();
                                                    embed2.setAuthor("Successfully edited event!");
                                                    member.user.send(embed2);
                                                } catch (err) {
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Date} date
     */
    loadAttendance(message, date) {
        const attendance = new Attendance(message.embeds[0], message.id, date, this.server.guild);
        this.events.set(attendance.id, attendance);
        console.log(`[ATTENDANCE] Loaded attendance ${attendance.title} of id: ${attendance.id}`);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Tier} tier
     * @param {Date} date
     */
    async loadAdvancedAttendance(message, tier, date) {
        const attendance = new AdvancedAttendance(this.client, message, this.server, tier, date, this);
        this.advancedEvents.set(attendance.id, attendance);
        //await attendance.reset();
        console.log(`[ADATTENDANCE] Loaded advancedattendance ${attendance.embed.title} of id: ${attendance.id}`);
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async awaitDeleteAttendance(reaction, user) {
        reaction.message.guild.members.fetch(user.id).then((member) => {
            const embed = new Discord.MessageEmbed();
            const attendance = this.fetch(reaction.message.id);
            if (attendance) {
                embed.setAuthor(`Are you sure you want to delete ${attendance.title}?`);
                member.user.send(embed).then(async (mes) => {
                    await mes.react(AttendanceManager.accept);
                    await mes.react(AttendanceManager.reject);
                    let filter = r => r.message.id === mes.id;
                    const collector = mes.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.on('collect', async (r, u) => {
                        if (r.emoji.name === AttendanceManager.accept) {
                            yesdelete = true;
                        }
                        collector.stop();
                    });
                    collector.on('end', async (collected) => {
                        if (yesdelete) {
                            embed.setAuthor(`Deleted ${attendance.title}!`);
                            member.user.send(embed).then(async () => {
                                await this.deleteAttendance(reaction.message);
                            });
                        } else {
                            embed.setAuthor(`Did not delete ${attendance.title}!`);
                            await member.user.send(embed);
                        }
                    });
                });
            }
        });
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async awaitDeleteAdvancedAttendance(reaction, user) {
        reaction.message.guild.members.fetch(user.id).then((member) => {
            const embed = new Discord.MessageEmbed();
            const attendance = this.fetchAdvanced(reaction.message.id);
            if (attendance) {
                embed.setAuthor(`Are you sure you want to delete ${attendance.embed.title}?`);
                member.user.send(embed).then(async (mes) => {
                    await mes.react(AttendanceManager.accept);
                    await mes.react(AttendanceManager.reject);
                    let filter = r => r.message.id === mes.id;
                    const collector = mes.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.on('collect', async (r, u) => {
                        if (r.emoji.name === AttendanceManager.accept) {
                            yesdelete = true;
                        }
                        collector.stop();
                    });
                    collector.on('end', async (collected) => {
                        if (yesdelete) {
                            embed.setAuthor(`Deleted ${attendance.embed.title}!`);
                            member.user.send(embed).then(async () => {
                                await this.deleteAdvancedAttendance(reaction.message);
                            });
                        } else {
                            embed.setAuthor(`Did not delete ${attendance.title}!`);
                            await member.user.send(embed);
                        }
                    });
                });
            }
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async deleteAttendance(message) {
        const attendanceevent = this.fetch(message.id);
        if (attendanceevent) {
            try {
                attendanceevent.schedule.cancel();
                this.events.delete(attendanceevent.id);
                if (!message.deleted) {
                    await message.delete({ timeout: 1000 });
                }
                await Database.run(Database.attendanceDeleteQuery, [attendanceevent.id]);
                console.log(`[UPDATE] Deleted attendance ${attendanceevent.title} of id: ${attendanceevent.id}`);
                if (this.server.modlog) {
                    this.server.modlog.send(`Here is the deleted attendance!`, attendanceevent.embed);
                }
            } catch (err) {
                console.log(err);
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async deleteAdvancedAttendance(message) {
        const attendanceevent = this.fetchAdvanced(message.id);
        if (attendanceevent) {
            try {
                this.advancedEvents.delete(attendanceevent.id);
                if (!message.deleted) {
                    await message.delete({ timeout: 1000 });
                }
                await Database.run(Database.advancedAttendanceDeleteQuery, [attendanceevent.id]);
                console.log(`[UPDATE] Deleted attendance ${attendanceevent.title} of id: ${attendanceevent.id}`);
                if (this.server.modlog) {
                    this.server.modlog.send(`Here is the deleted attendance!`, attendanceevent.embed);
                }
            } catch (err) {
                console.log(err);
            }
        }
    }

    /**
     * 
     * @param {string} id 
    */
    fetch(id) {
        return this.events.find((e) => e.id === id);
    }

    /**
     * 
     * @param {string} id 
     */
    fetchAdvanced(id) {
        return this.advancedEvents.get(id);
    }

    getEvents() {
        return this.events;
    }

    getAdvancedEvents() {
        return this.advancedEvents;
    }
}

module.exports = AttendanceManager;