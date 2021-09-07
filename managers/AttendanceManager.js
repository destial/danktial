const Discord = require('discord.js');
const Database = require('../database/Database');
const Attendance = require('../items/Attendance');
const AdvancedAttendance = require('../items/AdvancedAttendance');
const Server = require('../items/Server');
const formatDate = require('../utils/formatDate');
const Tier = require('../items/Tier');
const formatTrack = require('../utils/formatTrack');
const { timezones } = require('../utils/timezones');
const { Logger } = require('../utils/Utils');
const { MessageActionRow, MessageButton } = require('discord-buttons');
const formatDateURL = require('../utils/formatDateURL');
const OpenAttendance = require('../items/OpenAttendance');

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

        /**
         * @type {Discord.Collection<string, OpenAttendance>}
         * @private
         */
        this.openEvents = new Discord.Collection();
        this.server = server;
        this.client = client;
    }

    static get accept() { return "✅"; }
    static get reject() { return "❌"; }
    static get tentative() { return "❔"; }
    static get delete() { return "🗑️"; }
    static get unknown() { return "🟠"; }
    static get numbers() { return ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🇦", "🇧","🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"]; }

    /**
     * 
     * @param {Server} server 
     * @param {Discord.GuildMember} member 
     * @param {Discord.TextChannel} channel
     * @returns {Promise<OpenAttendance>} 
     */
    async newOpenAttendance(server, member, channel) {
        const embed = new Discord.MessageEmbed().setColor('RED');
        if (server.getTierManager().tiers.size === 0) {
            return new Promise(async (resolve, reject) => {
                embed.setAuthor(`You do not have any tiers! Please setup using ${server.prefix}setup`);
                channel.send(embed);
                resolve(undefined);
            });
        }
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const questions = [
                "What is the title of this event?",
                "What is the description of the event?",
                "What is the date of this event? Format should be: DD/MM/YYYY hh:mm TMZE",
                "What is the tier of this event? Reply with the following:"
            ];
            const tierNames = [];
            server.getTierManager().tiers.forEach(tier => {
                tierNames.push("`" + tier.name + "`");
            });
            const answers = [];
            const dateformat = "DD/MM/YYYY hh:mm TMZE";

            embed.setAuthor(questions[counter++]);
            const dm = await member.user.send(embed);
            const filter = m => m.author.id === member.id;
            const collector = dm.channel.createMessageCollector(filter, {
                max: questions.length,
                time: 5*60000
            });

            collector.on('collect', async (message, col) => {
                const embed3 = new Discord.MessageEmbed();
                embed3.setColor('RED');
                if (counter < questions.length) {
                    embed3.setAuthor(questions[counter++]);
                    if (counter === questions.length-1) {
                        var allTimezones = 'Here are your choices for timezones:\n';
                        timezones.keyArray().forEach(tmze => {
                            allTimezones += "`" + tmze + "`\n";
                        });
                        embed3.setDescription(allTimezones);
                    }
                    if (counter === questions.length) {
                        embed3.setDescription(tierNames.join('\n'));
                    } 
                    member.user.send(embed3);
                }
            });

            collector.on('end', async (collected) => {
                collected.forEach((collect) => {
                    answers.push(collect.content);
                });
                const title = answers[0];
                const description = answers[1];
                const date = answers[2];
                const tier = answers[3];
                const replyEmbed = new Discord.MessageEmbed();
                replyEmbed.setColor('RED');
                if (!title || !description || !date || !tier) {
                    replyEmbed.setAuthor("Ran out of time or no valid inputs!");
                    member.user.send(replyEmbed);
                    return resolve();
                }
                const t = server.getTierManager().getTier(tier);
                if (!t) {
                    replyEmbed.setAuthor("Tier is invalid! Did not match any tier of:");
                    replyEmbed.setDescription(tierNames.join('\n'));
                    member.user.send(replyEmbed);
                    return resolve();
                }
                if (date.length !== dateformat.length && date.length !== dateformat.length-1) {
                    replyEmbed.setAuthor("Invalid date! Formatting error! (DD/MM/YYYY hh:mm TMZE)");
                    replyEmbed.setDescription(`E.g: 01/01/2021 10:45 SGT or 20/04/2021 09:30 AEDT`);
                    member.user.send(embed);
                    return resolve();
                }
                const attendanceembed = new Discord.MessageEmbed();
                try {
                    const dateObject = await formatDate(date.toUpperCase());
                    if (dateObject < Date.now()) {
                        const dateNow = new Date();
                        const difference = dateNow.getTime() - dateObject.getTime();
                        replyEmbed.setAuthor("Invalid date! Date cannot be in the past!");
                        replyEmbed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                        member.user.send(replyEmbed);
                        return resolve();
                    }
                    attendanceembed.setTitle(title);
                    attendanceembed.setDescription(description);
                    if (formatTrack(title)) {
                        attendanceembed.setThumbnail(formatTrack(title));
                    } else if (formatTrack(description)) {
                        attendanceembed.setThumbnail(formatTrack(description));
                    }
                    var time = `${dateObject.getTime()}`;
                    time = time.substring(0, 10);
                    attendanceembed.addFields(
                        { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(dateObject)})`, inline: false }
                    );
                    var i = 0;
                    t.teams.forEach(team => {
                        attendanceembed.addField(`${AttendanceManager.numbers[i++]}  ${team.name}`, '-', false);
                    });
                    attendanceembed.addField(`🇷 Reserves`, '-', false);
                    attendanceembed.setFooter(t.name);
                    attendanceembed.setTimestamp(dateObject);
                    attendanceembed.setColor('RED');
                    const m = await channel.send(attendanceembed);
                    const reactionsPromise = new Promise(async (re, rej) => {
                        for (var ii = 0; ii < i; ++i) {
                            await m.react(AttendanceManager.numbers[ii]);
                        }
                        await m.react(AdvancedAttendance.editEmoji);
                        await m.react(AdvancedAttendance.lockEmoji);
                        return re();
                    });
                    reactionsPromise.then(() => {});
                    replyEmbed.setAuthor(`Successfully created attendance ${title}`);
                    replyEmbed.setDescription(`[Click here to view the attendance](${m.url})`);
                    member.user.send(replyEmbed);
                    const attendance = new OpenAttendance(client, m, server, t, dateObject, this);
                    attendance.creator = member;
                    attendance.timezone = date.substring(date.length-4).trim().toUpperCase();
                    this.openEvents.set(attendance.id, attendance);
                    try {
                        attendance.save();
                        this.server.update();
                        resolve(attendance);
                    } catch (err) {
                        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                        resolve(attendance);
                    }
                } catch(err) {
                    replyEmbed.setAuthor(`Invalid date! ${date.toUpperCase()} is an incorrect input!`);
                    replyEmbed.setDescription(`E.g: 01/01/2021 10:45 SGT or 20/04/2021 04:20 AEDT`);
                    member.user.send(embed);
                    return resolve();
                }
            });
        });
    }

    /**
     * @param {Discord.Client} client
     * @param {Discord.GuildMember} member 
     * @param {Server} server
     * @param {Discord.TextChannel} channel 
     * @returns {Promise<AdvancedAttendance>} 
     */
    async newAdvancedAttendance(client, server, member, channel) {
        const embed = new Discord.MessageEmbed();
        embed.setColor('RED');
        if (server.getTierManager().tiers.size === 0) {
            return new Promise(async (resolve, reject) => {
                embed.setAuthor(`You do not have any tiers! Please setup using ${server.prefix}setup`);
                channel.send(embed);
                resolve(undefined);
            });
        }
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const questions = [
                "What is the title of this event?",
                "What is the description of the event?",
                "What is the date of this event? Format should be: DD/MM/YYYY hh:mm TMZE",
                "What is the tier of this event? Reply with the following:"
            ];
            const tierNames = [];
            server.getTierManager().tiers.forEach(tier => {
                tierNames.push("`" + tier.name + "`");
            });
            const answers = [];
            const dateformat = "DD/MM/YYYY hh:mm TMZE";

            embed.setAuthor(questions[counter++]);
            const dm = await member.user.send(embed);
            const filter = m => m.author.id === member.id;
            const collector = dm.channel.createMessageCollector(filter, {
                max: questions.length,
                time: 5*60000
            });

            collector.on('collect', async (message, col) => {
                const embed3 = new Discord.MessageEmbed();
                embed3.setColor('RED');
                if (counter < questions.length) {
                    embed3.setAuthor(questions[counter++]);
                    if (counter === questions.length-1) {
                        var allTimezones = 'Here are your choices for timezones:\n';
                        timezones.keyArray().forEach(tmze => {
                            allTimezones += "`" + tmze + "`\n";
                        });
                        embed3.setDescription(allTimezones);
                    }
                    if (counter === questions.length) {
                        embed3.setDescription(tierNames.join('\n'));
                    } 
                    member.user.send(embed3);
                }
            });

            collector.on('end', async (collected) => {
                collected.forEach((collect) => {
                    answers.push(collect.content);
                });
                const title = answers[0];
                const description = answers[1];
                const date = answers[2];
                const tier = answers[3];
                const replyEmbed = new Discord.MessageEmbed();
                replyEmbed.setColor('RED');
                if (!title || !description || !date || !tier) {
                    replyEmbed.setAuthor("Ran out of time or no valid inputs!");
                    member.user.send(replyEmbed);
                    resolve(undefined);
                } else if (date.length !== dateformat.length && date.length !== dateformat.length-1) {
                    replyEmbed.setAuthor("Invalid date! Formatting error! (DD/MM/YYYY hh:mm TMZE)");
                    replyEmbed.setDescription(`E.g: 01/01/2021 10:45 SGT or 20/04/2021 09:30 AEDT`);
                    member.user.send(embed);
                    resolve(undefined);
                } else if (!server.getTierManager().getTier(tier.toLowerCase())) {
                    replyEmbed.setAuthor("Tier is invalid! Did not match any tier of:");
                    replyEmbed.setDescription(tierNames.join('\n'));
                    member.user.send(replyEmbed);
                    resolve(undefined);
                } else {
                    const t = server.getTierManager().getTier(tier.toLowerCase());
                    const attendanceembed = new Discord.MessageEmbed();
                    formatDate(date.toUpperCase()).then((dateObject) => {
                        if (dateObject < Date.now()) {
                            const dateNow = new Date();
                            const difference = dateNow.getTime() - dateObject.getTime();
                            replyEmbed.setAuthor("Invalid date! Date cannot be in the past!");
                            replyEmbed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                            member.user.send(replyEmbed);
                            resolve();
                        } else {
                            attendanceembed.setTitle(title);
                            attendanceembed.setDescription(description);
                            if (formatTrack(title)) {
                                attendanceembed.setThumbnail(formatTrack(title));
                            } else if (formatTrack(description)) {
                                attendanceembed.setThumbnail(formatTrack(description));
                            }
                            var time = `${dateObject.getTime()}`;
                            time = time.substring(0, 10);
                            attendanceembed.addFields(
                                { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(dateObject)})`, inline: false }
                            );
                            t.teams.forEach(team => {
                                const driverNames = [];
                                if (team.drivers.size === 0) {
                                    driverNames.push('-');
                                }
                                team.drivers.forEach(d => {
                                    driverNames.push(`${AttendanceManager.unknown} ${d.member}`);
                                });
                                attendanceembed.addField(team.name, driverNames.join('\n'), false);
                            });
                            const reserveNames = [];
                            if (t.reserves.size !== 0) {
                                t.reserves.forEach(reserve => {
                                    reserveNames.push(`${AttendanceManager.unknown} ${reserve.member}`);
                                });
                                attendanceembed.addField('Reserves', reserveNames.join('\n'), false);
                            }
                            attendanceembed.setFooter(t.name);
                            attendanceembed.setTimestamp(dateObject);
                            attendanceembed.setColor('RED');
                            const acceptButton = new MessageButton()
                                .setStyle('green')
                                .setID('advanced_accept')
                                .setLabel('Accept');
                            const rejectButton = new MessageButton()
                                .setStyle('red')
                                .setID('advanced_reject')
                                .setLabel('Reject');
                            const tentativeButton = new MessageButton()
                                .setStyle('blurple')
                                .setID('advanced_tentative')
                                .setLabel('Tentative');
                            const row = new MessageActionRow().addComponents(acceptButton, rejectButton, tentativeButton);
                            channel.send(attendanceembed, { component: row }).then(async (m) => {
                                m.react(AttendanceManager.delete).then(async () => {
                                    await m.react(AdvancedAttendance.editEmoji);
                                    if (!attendance.isLocked()) {
                                        await m.react(AdvancedAttendance.lockEmoji);
                                    } else {
                                        await m.react(AdvancedAttendance.unlockEmoji);
                                    }
                                });
                                replyEmbed.setAuthor(`Successfully created attendance ${title}`);
                                replyEmbed.setDescription(`[Click here to view the attendance](${m.url})`);
                                member.user.send(replyEmbed);
                                const attendance = new AdvancedAttendance(client, m, server, t, dateObject, this);
                                attendance.creator = member;
                                attendance.timezone = date.substring(date.length-4).trim().toUpperCase();
                                this.advancedEvents.set(attendance.id, attendance);
                                try {
                                    attendance.save();
                                    this.server.update();
                                    const key = timezones.keyArray().find(t => date.toUpperCase().trim().endsWith(t.substring(0, 4).trim()));
                                    const diff = timezones.get(key);
                                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Created attendance from timezone UTC ${diff}`);
                                    resolve(attendance);
                                } catch (err) {
                                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                                    resolve(attendance);
                                }
                            });
                        }
                    }).catch(async (dateo) => {
                        replyEmbed.setAuthor(`There was an error while making an attendance! Perhaps there are no drivers in this tier?`);
                        member.user.send(replyEmbed);
                        resolve(undefined);
                    });
                }
            });
        });
    }

    /**
     * 
     * @param {string} title 
     * @param {string} description 
     * @param {Date} date 
     * @param {string} timezone
     * @param {Tier} t 
     * @param {Discord.TextChannel} channel 
     * @param {function} resolve 
     */
    async createAdvanced(title, description, date, timezone, t, channel, resolve) {
        const attendanceembed = new Discord.MessageEmbed();
        attendanceembed.setTitle(title);
        attendanceembed.setDescription(description);
        if (formatTrack(title)) {
            attendanceembed.setThumbnail(formatTrack(title));
        } else if (formatTrack(description)) {
            attendanceembed.setThumbnail(formatTrack(description));
        }
        var time = `${date.getTime()}`;
        time = time.substring(0, 10);
        attendanceembed.addFields(
            { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(date)})`, inline: false }
        );
        t.teams.forEach(team => {
            const driverNames = [];
            if (team.drivers.size === 0) {
                driverNames.push('-');
            }
            team.drivers.forEach(d => {
                driverNames.push(`${AttendanceManager.unknown} ${d.member}`);
            });
            attendanceembed.addField(team.name, driverNames.join('\n'), false);
        });
        const reserveNames = [];
        if (t.reserves.size !== 0) {
            t.reserves.forEach(reserve => {
                reserveNames.push(`${AttendanceManager.unknown} ${reserve.member}`);
            });
            attendanceembed.addField('Reserves', reserveNames.join('\n'), false);
        }
        attendanceembed.setFooter(t.name);
        attendanceembed.setTimestamp(date);
        attendanceembed.setColor('RED');
        const acceptButton = new MessageButton()
            .setStyle('green')
            .setID('advanced_accept')
            .setLabel('Accept');
        const rejectButton = new MessageButton()
            .setStyle('red')
            .setID('advanced_reject')
            .setLabel('Reject');
        const tentativeButton = new MessageButton()
            .setStyle('blurple')
            .setID('advanced_tentative')
            .setLabel('Tentative');
        const row = new MessageActionRow().addComponents(acceptButton, rejectButton, tentativeButton);
        channel.send(attendanceembed, { component: row }).then(async (m) => {
            m.react(AttendanceManager.delete).then(async () => {
                await m.react(AdvancedAttendance.editEmoji);
                if (!attendance.isLocked()) {
                    await m.react(AdvancedAttendance.lockEmoji);
                } else {
                    await m.react(AdvancedAttendance.unlockEmoji);
                }
            });
            const attendance = new AdvancedAttendance(this.client, m, t.server, t, date, this);
            attendance.timezone = timezone;
            this.advancedEvents.set(attendance.id, attendance);
            try {
                attendance.save();
                this.server.update();
                resolve(attendance);
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                resolve(attendance);
            }
        });
    }

    /**
     * @param {Attendance | AdvancedAttendance} attendance 
     */
    async createSchedule(attendance) {
        if (attendance.next) {
            if (attendance.attendanceType === 'advanced') {
                const dateObject = new Date(attendance.next.date);
                const attendanceembed = new Discord.MessageEmbed();
                attendanceembed.setTitle(attendance.next.title);
                attendanceembed.setDescription(attendance.next.description);
                if (formatTrack(attendance.next.title)) {
                    attendanceembed.setThumbnail(formatTrack(attendance.next.title));
                } else if (formatTrack(description)) {
                    attendanceembed.setThumbnail(formatTrack(attendance.next.description));
                }
                var time = `${dateObject.getTime()}`;
                time = time.substring(0, 10);
                attendanceembed.addFields(
                    { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(dateObject)})`, inline: false }
                );
                attendance.tier.teams.forEach(team => {
                    const driverNames = [];
                    if (team.drivers.size === 0) {
                        driverNames.push('-');
                    }
                    team.drivers.forEach(d => {
                        driverNames.push(`${AttendanceManager.unknown} ${d.member}`);
                    });
                    attendanceembed.addField(team.name, driverNames.join('\n'), false);
                });
                const reserveNames = [];
                if (attendance.tier.reserves.size !== 0) {
                    attendance.tier.reserves.forEach(reserve => {
                        reserveNames.push(`${AttendanceManager.unknown} ${reserve.member}`);
                    });
                    attendanceembed.addField('Reserves', reserveNames.join('\n'), false);
                }
                attendanceembed.setFooter(attendance.tier.name);
                attendanceembed.setTimestamp(dateObject);
                attendanceembed.setColor('RED');
                const m = await attendance.message.channel.send(attendanceembed)
                m.react(AttendanceManager.accept).then(async () => {
                    await m.react(AttendanceManager.reject);
                    await m.react(AttendanceManager.tentative);
                    await m.react(AttendanceManager.delete);
                    await m.react(AdvancedAttendance.editEmoji);
                    await m.react(AdvancedAttendance.lockEmoji);
                });
                const a = new AdvancedAttendance(attendance.client, m, attendance.server, attendance.tier, dateObject, this);
                a.creator = attendance.creator;
                a.type = attendance.type;
                this.advancedEvents.set(a.id, a);
                this.server.update();
                try {
                    a.save();
                    return a;
                } catch (err) {
                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                }
            } else if (attendance.attendanceType === 'normal') {
                const dateObject = new Date(attendance.next.date);
                const attendanceembed = new Discord.MessageEmbed();
                attendanceembed.setTitle(attendance.next.title);
                attendanceembed.setDescription(attendance.next.description);
                if (formatTrack(attendance.next.title)) {
                    attendanceembed.setThumbnail(formatTrack(attendance.next.title));
                } else if (formatTrack(attendance.next.description)) {
                    attendanceembed.setThumbnail(formatTrack(attendance.next.description));
                }
                var time = `${dateObject.getTime()}`;
                time = time.substring(0, 10);
                attendanceembed.addFields(
                    { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(dateObject)})`, inline: false },
                    { name: `${AttendanceManager.accept} Accepted (0)`, value: ">>> -", inline: true },
                    { name: `${AttendanceManager.reject} Rejected (0)`, value: ">>> -", inline: true },
                    { name: `${AttendanceManager.tentative} Tentative (0)`, value: ">>> -", inline: true }
                );
                attendanceembed.setFooter('Local Time');
                attendanceembed.setTimestamp(dateObject);
                attendanceembed.setColor('RED');
                const m = await channel.send(attendanceembed)
                m.react(AttendanceManager.accept).then(async () => {
                    await m.react(AttendanceManager.reject);
                    await m.react(AttendanceManager.tentative);
                    await m.react(AttendanceManager.delete);
                });
                const a = new Attendance(attendanceembed, m.id, dateObject, this.server, m, this.client);
                a.creator = attendance.creator;
                a.timezone = attendance.timezone;
                this.events.set(attendance.id, attendance);
                try {
                    Database.run(Database.attendanceSaveQuery, [attendance.id, String(attendance.date.getTime()), channel.id]);
                    this.server.update();
                    Logger.info(`[ATTENDANCE] Saved attendance ${attendance.title} of id ${attendance.id}`);
                    return attendance;
                } catch (err) {
                    this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                }
            }
        }
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @param {Discord.TextChannel} channel 
     * @returns {Promise<Attendance>}
     */
    async newAttendance(member, channel) {
        const embed = new Discord.MessageEmbed();
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const questions = [
                "What is the title of this event?",
                "What is the description of the event?",
                "What is the date of this event? Format should be: DD/MM/YYYY hh:mm TMZE"
            ];
            /**
             * @type {string[]}
             */
            var answers = [];
            const dateformat = "DD/MM/YYYY hh:mm TMZE";

            embed.setAuthor(questions[counter++]);
            embed.setColor('RED');
            member.user.send(embed).then((dm) => {
                const filter = m => m.author.id === member.id;
                const collector = dm.channel.createMessageCollector(filter, {
                    max: questions.length,
                    time: 5*60000
                });
                collector.on('collect', async (message, col) => {
                    const embed3 = new Discord.MessageEmbed();
                    if (counter < questions.length) {
                        embed3.setAuthor(questions[counter++]);
                        embed3.setColor('RED');
                        if (counter === questions.length) {
                            var allTimezones = 'Here are your choices for timezones:\n';
                            timezones.keyArray().forEach(tmze => {
                                allTimezones += "`" + tmze + "`\n";
                            });
                            embed3.setDescription(allTimezones);
                        }
                        member.user.send(embed3);
                    }
                });
                collector.on('end', async (collected) => {
                    collected.forEach((collect) => {
                        answers.push(collect.content);
                    });
                    const title = answers[0];
                    const description = answers[1];
                    const date = answers[2];
                    if (!title || !description || !date) {
                        embed.setAuthor("Ran out of time!");
                        member.user.send(embed);
                        resolve();
                    } else if (date.length !== dateformat.length && date.length !== dateformat.length-1) {
                        embed.setAuthor("Invalid date! Formatting error! (DD/MM/YYYY hh:mm TMZE)");
                        embed.setDescription(`E.g: 01/01/2021 10:45 SGT or 20/04/2021 09:30 AEDT`);
                        member.user.send(embed);
                        resolve();
                    } else {
                        const attendanceembed = new Discord.MessageEmbed();
                        formatDate(date.toUpperCase()).then((dateObject) => {
                            if (dateObject < Date.now()) {
                                const dateNow = new Date();
                                const difference = dateNow.getTime()-dateObject.getTime();
                                embed.setAuthor("Invalid date! Date cannot be in the past!");
                                embed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                                member.user.send(embed);
                                resolve();
                            } else {
                                attendanceembed.setTitle(title);
                                attendanceembed.setDescription(description);
                                if (formatTrack(title)) {
                                    attendanceembed.setThumbnail(formatTrack(title));
                                } else if (formatTrack(description)) {
                                    attendanceembed.setThumbnail(formatTrack(description));
                                }
                                const time = `${dateObject.getTime()}`.substring(0,10);
                                attendanceembed.addFields(
                                    { name: "Date & Time", value: `[<t:${time}:F>](${formatDateURL(dateObject)})`, inline: false },
                                    { name: `${AttendanceManager.accept} Accepted (0)`, value: ">>> -", inline: true },
                                    { name: `${AttendanceManager.reject} Rejected (0)`, value: ">>> -", inline: true },
                                    { name: `${AttendanceManager.tentative} Tentative (0)`, value: ">>> -", inline: true }
                                );
                                attendanceembed.setFooter('Local Time');
                                attendanceembed.setTimestamp(dateObject);
                                attendanceembed.setColor('RED');
                                channel.send(attendanceembed).then(async (m) => {
                                    m.react(AttendanceManager.accept).then(async() => {
                                        await m.react(AttendanceManager.reject);
                                        await m.react(AttendanceManager.tentative);
                                        await m.react(AttendanceManager.delete)
                                    });
                                    const embed3 = new Discord.MessageEmbed();
                                    embed3.setAuthor(`Successfully created event ${title}`);
                                    embed3.setDescription(`[Click here to view the attendance](${m.url})`);
                                    embed3.setColor('RED');
                                    member.user.send(embed3);
                                    const attendance = new Attendance(attendanceembed, m.id, dateObject, this.server, m, this.client);
                                    attendance.creator = member;
                                    attendance.timezone = date.substring(date.length-4).trim().toUpperCase();
                                    this.events.set(attendance.id, attendance);
                                    try {
                                        Database.run(Database.attendanceSaveQuery, [attendance.id, String(attendance.date.getTime()), channel.id]);
                                        this.server.update();
                                        Logger.info(`[ATTENDANCE] Saved attendance ${attendance.title} of id ${attendance.id}`);
                                        resolve(attendance);
                                    } catch (err) {
                                        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                                        resolve(attendance);
                                    }
                                });
                            }
                        }).catch((err) => {
                            embed.setAuthor(`There was an error while making an attendance!`);
                            member.user.send(embed);
                            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
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
        embed.setColor('RED');
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
                    embed2.setColor('RED');
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
                                embed2.setAuthor("Enter the new date: (Format is DD/MM/YYYY hh:mm TMZE)");
                                var allTimezones = 'Here are your choices for timezones:\n';
                                timezones.keyArray().forEach(tmze => {
                                    allTimezones += "`" + tmze + "`\n";
                                });
                                embed2.setDescription(allTimezones);
                            } else {
                                embed2.setAuthor('Ran out of time!');
                            }
                            member.user.send(embed2).then((m3) => {
                                if (emojiname) {
                                    let mfilter = m => m.author.id === member.id;
                                    let mcollector = m3.channel.createMessageCollector(mfilter, {max: 1, time: 60000});
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
                                                    const time = `${date.getTime()}`.substring(0,10);
                                                    mcollector.stop();
                                                    attendanceevent.updateDate(date, `<t:${time}:F>`);
                                                    attendanceevent.edit();
                                                }
                                            }).catch((err) => {
                                                embed2.setAuthor("Invalid date! Please try again! (Format is DD/MM/YYYY hh:mm TMZE)");
                                                member.user.send(embed2);
                                            });
                                        }
                                    });
                                    mcollector.on('end', async (mcollected) => {
                                        attendanceevent.message.edit(attendanceevent.embed).then(async (m5) => {
                                            try {
                                                const embed3 = new Discord.MessageEmbed();
                                                embed3.setColor('RED');
                                                Database.run(Database.attendanceSaveQuery, [attendanceevent.id, String(attendanceevent.date.getTime()), attendanceevent.message.channel.id]);
                                                this.server.update();
                                                Logger.info(`[ATTENDANCE] Edited attendance ${attendanceevent.title} of id: ${attendanceevent.id}`);
                                                embed3.setAuthor("Successfully edited event!");
                                                member.user.send(embed3);
                                                this.server.log(`${member.user.tag} has edited attendance ${attendanceevent.title}`);
                                            } catch (err) {
                                                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
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
    }

    /**
     * 
     * @param {Discord.GuildMember} member
     * @param {AdvancedAttendance} attendanceevent
     */
    async editAdvancedAttendance(member, attendanceevent) {
        const embed = new Discord.MessageEmbed();
        embed.setColor('RED');
        member.user.send(attendanceevent.embed).then((em) => {
            const embed2 = new Discord.MessageEmbed();
            embed2.setColor('RED');
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
                        embed2.setAuthor("Enter the new date: (Format is DD/MM/YYYY 20:30 TMZE)");
                        var allTimezones = 'Here are your choices for timezones:\n';
                        timezones.keyArray().forEach(tmze => {
                            allTimezones += "`" + tmze + "`\n";
                        });
                        embed2.setDescription(allTimezones);
                    }
                    member.user.send(embed2).then((m3) => {
                        let mfilter = m => m.author.id === member.id;
                        const mcollector = m3.channel.createMessageCollector(mfilter, { max: 1, time: 60000});
                        mcollector.on('collect', async (message) => {
                            mcollector.stop();
                        });
                        mcollector.once('end', async (mcollected) => {
                            if (!mcollected.first()) {
                                const embed4 = new Discord.MessageEmbed();
                                embed4.setColor('RED');
                                embed4.setAuthor('Ran out of time!');
                                member.send(embed4);
                                return;
                            }
                            let edit = mcollected.first().content;
                            const embed3 = new Discord.MessageEmbed();
                            embed3.setColor('RED');
                            if (edit) {
                                if (emojiname === "🇹") {
                                    attendanceevent.embed.setTitle(edit);
                                    if (formatTrack(edit)) {
                                        attendanceevent.embed.setThumbnail(formatTrack(edit));
                                    }
                                    attendanceevent.message.edit(attendanceevent.embed).then(async (m5) => {
                                        try {
                                            attendanceevent.update();
                                            embed3.setAuthor(`Successfully edited attendance!`);
                                            member.user.send(embed3);
                                            this.server.log(`${member.user.tag} has edited attendance ${attendanceevent.embed.title}`);
                                            return;
                                        } catch (err) {
                                            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                                        }
                                    });
                                } else if (emojiname === "🇩") {
                                    attendanceevent.embed.setDescription(edit);
                                    if (formatTrack(edit)) {
                                        attendanceevent.embed.setThumbnail(formatTrack(edit));
                                    }
                                    attendanceevent.message.edit(attendanceevent.embed).then(async (m5) => {
                                        try {
                                            attendanceevent.update();
                                            embed3.setAuthor(`Successfully edited attendance!`);
                                            member.user.send(embed3);
                                            this.server.log(`${member.user.tag} has edited attendance ${attendanceevent.embed.title}`);
                                            return;
                                        } catch (err) {
                                            this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                                        }
                                    });
                                } else if (emojiname === "📆") {
                                    const dateNow = new Date();
                                    formatDate(edit).then((date) => {
                                        if (date.getTime() < dateNow.getTime()) {
                                            const difference = dateNow.getTime() - date.getTime();
                                            embed.setAuthor("Invalid date! Date cannot be in the past!");
                                            embed.setDescription(`Your input date was ${difference} milliseconds in the past!\n(${difference/3600000} hours in the past)`);
                                            member.user.send(embed);
                                            return;
                                        } else {
                                            const time = `${date.getTime()}`.substring(0,10);
                                            attendanceevent.updateDate(date, `<t:${time}:F>`);
                                        }
                                        attendanceevent.message.edit(attendanceevent.embed).then(async (m5) => {
                                            try {
                                                attendanceevent.update();
                                                this.server.update();
                                                embed3.setAuthor(`Successfully edited attendance!`);
                                                member.user.send(embed3);
                                                this.server.log(`${member.user.tag} has edited attendance ${attendanceevent.embed.title}`);
                                                return;
                                            } catch (err) {
                                                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                                            }
                                        });
                                    }).catch((err) => {
                                        embed2.setAuthor("Invalid date! Please try again! (Format is DD/MM/YYYY 20:30 TMZE)");
                                        member.user.send(embed2);
                                    });
                                }
                            }
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
        const attendance = new Attendance(message.embeds[0], message.id, date, this.server.guild, message, this.client);
        this.events.set(attendance.id, attendance);
        Logger.boot(`[ATTENDANCE] Loaded attendance ${attendance.title} from ${this.server.guild.name}`);
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ATTENDANCE] Loaded attendance ${attendance.title} from ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Tier} tier
     * @param {Date} date
     */
    loadAdvancedAttendance(message, tier, date) {
        const attendance = new AdvancedAttendance(this.client, message, this.server, tier, date, this);
        this.advancedEvents.set(attendance.id, attendance);
        Logger.boot(`[ADATTENDANCE] Loaded advancedattendance ${attendance.embed.title} from ${this.server.guild.name}`);
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Loaded advancedattendance ${attendance.embed.title} from ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Tier} tier
     * @param {Date} date
     */
    loadOpenAttendance(message, tier, date) {
        const attendance = new OpenAttendance(this.client, message, this.server, tier, date, this);
        this.openEvents.set(attendance.id, attendance);
        Logger.boot(`[ADATTENDANCE] Loaded openattendance ${attendance.embed.title} from ${this.server.guild.name}`);
        this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(`[ADATTENDANCE] Loaded advancedattendance ${attendance.embed.title} from ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */
    async awaitDeleteAttendance(reaction, user) {
        reaction.message.guild.members.fetch(user.id).then((member) => {
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            const attendance = this.fetch(reaction.message.id);
            if (attendance) {
                embed.setAuthor(`Are you sure you want to delete ${attendance.title}?`);
                member.user.send(embed).then(async (mes) => {
                    mes.react(AttendanceManager.accept).then(async () => {
                        await mes.react(AttendanceManager.reject);
                    });
                    let filter = (r, u) =>  { return r.message.id === mes.id && u.id === user.id };
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
                                this.deleteAttendance(reaction.message);
                            });
                        } else {
                            embed.setAuthor(`Did not delete ${attendance.title}!`);
                            member.user.send(embed);
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
            embed.setColor('RED');
            const attendance = this.fetchAdvanced(reaction.message.id);
            if (attendance) {
                embed.setAuthor(`Are you sure you want to delete ${attendance.embed.title}?`);
                member.user.send(embed).then(async (mes) => {
                    mes.react(AttendanceManager.accept).then(async () => {
                        await mes.react(AttendanceManager.reject);
                    });
                    let filter = (r, u) =>  { return r.message.id === mes.id && u.id === user.id };
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
                                this.deleteAdvancedAttendance(reaction.message);
                            });
                        } else {
                            embed.setAuthor(`Did not delete ${attendance.embed.title}!`);
                            member.user.send(embed);
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
    async awaitDeleteOpenAttendance(reaction, user) {
        reaction.message.guild.members.fetch(user.id).then((member) => {
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            const attendance = this.fetchOpen(reaction.message.id);
            if (attendance) {
                embed.setAuthor(`Are you sure you want to delete ${attendance.embed.title}?`);
                member.user.send(embed).then(async (mes) => {
                    mes.react(AttendanceManager.accept).then(async () => {
                        await mes.react(AttendanceManager.reject);
                    });
                    let filter = (r, u) =>  { return r.message.id === mes.id && u.id === user.id };
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
                                this.deleteOpenAttendance(reaction.message);
                            });
                        } else {
                            embed.setAuthor(`Did not delete ${attendance.embed.title}!`);
                            member.user.send(embed);
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
    deleteAttendance(message) {
        const attendanceevent = this.fetch(message.id);
        if (attendanceevent) {
            try {
                if (attendanceevent.schedule)
                    attendanceevent.schedule.cancel();
                this.events.delete(attendanceevent.id);
                if (!message.deleted) {
                    message.delete({ timeout: 1000 });
                }
                attendanceevent.delete();
                if (this.server.modlog) {
                    this.server.modlog.send(`Here is the deleted attendance!`, attendanceevent.embed);
                }
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    deleteAdvancedAttendance(message) {
        const attendanceevent = this.fetchAdvanced(message.id);
        if (attendanceevent) {
            try {
                this.advancedEvents.delete(attendanceevent.id);
                if (!message.deleted) {
                    message.delete({ timeout: 1000 });
                }
                attendanceevent.delete();
                if (this.server.modlog) {
                    this.server.modlog.send(`Here is the deleted attendance!`, attendanceevent.embed);
                }
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
            }
        }
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    deleteOpenAttendance(message) {
        const attendanceevent = this.fetchOpen(message.id);
        if (attendanceevent) {
            try {
                this.openEvents.delete(attendanceevent.id);
                if (!message.deleted) {
                    message.delete({ timeout: 1000 });
                }
                attendanceevent.delete();
                if (this.server.modlog) {
                    this.server.modlog.send(`Here is the deleted attendance!`, attendanceevent.embed);
                }
            } catch (err) {
                this.client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
            }
        }
    }

    /**
     * 
     * @param {string} id 
    */
    fetch(id) {
        return this.events.get(id);
    }

    /**
     * 
     * @param {string} id 
     */
    fetchAdvanced(id) {
        return this.advancedEvents.get(id);
    }

    /**
     * 
     * @param {string} id 
     */
    fetchOpen(id) {
        return this.openEvents.get(id);
    }

    getEvents() {
        return this.events;
    }

    getAdvancedEvents() {
        return this.advancedEvents;
    }

    getOpenEvents() {
        return this.openEvents;
    }
}

module.exports = AttendanceManager;