const Database = require('../database/Database');
const { accept, reject } = require('../managers/AttendanceManager');

const Discord = require('discord.js');
const { Logger } = require('../utils/Utils');
const formatTicket = require('../utils/formatTicket');

class Ticket {
    constructor(member, number, channel, base, ticketManager) {
        this.ticketManager = ticketManager;
        this.id = channel.id;
        this.guild = channel.guild;
        this.member = member;
        this.number = number;
        this.channel = channel;
        this.base = base;
    }

    async addUser(member) {
        await this.channel.createOverwrite(member, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
            ATTACH_FILES: true,
        });
        this.channel.send(new Discord.MessageEmbed()
            .setAuthor(`Added ${member.user.tag} to this ticket!`)
            .setColor('GREEN'));
        this.ticketManager.server.log(`Added ${member.user.tag} to ticket ${this.channel.name}`);
    }

    async awaitCloseR(reaction, member) {
        return new Promise(async (resolve, rej) => {
            if (reaction.message.id === this.base.id) {
                try {
                    const a = await this.base.react(accept);
                    const b = await this.base.react(reject);
                    reaction.users.remove(member.user);
                    let filter = (r, u) => (u.id === member.id && 
                                            r.message.id === this.base.id && 
                                            (r.emoji.name === accept || r.emoji.name === reject));

                    const collector = this.base.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.once('collect', async (r, u) => {
                        if (r.emoji.name === accept) {
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
                    this.ticketManager.client.manager.debug(err.message);
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }

    async awaitCloseC(message, member) {
        return new Promise(async (resolve, rej) => {
            if (message.channel.id === this.channel.id) {
                try {
                    const a = await message.react(accept);
                    const b = await message.react(reject);
                    let filter = (r, u) => (u.id === member.id && 
                                            r.message.id === message.id && 
                                            (r.emoji.name === accept || r.emoji.name === reject));

                    const collector = message.createReactionCollector(filter, { time: 60000 });
                    var yesdelete = false;
                    collector.once('collect', async (r, u) => {
                        if (r.emoji.name === accept) {
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
                    this.ticketManager.client.manager.debug(err.message);
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }

    async close(member) {
        return new Promise(async (resolve, rej) => {
            try {
                const embed = new Discord.MessageEmbed()
                    .setAuthor('This ticket will close in 5 seconds!')
                    .setColor('RED');
                await this.channel.send({ embeds: [embed] });
                await this.export();
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
                    Logger.log(`[TICKET] Deleted ticket ${this.channel.name} from ${this.channel.guild.name} by ${this.member.user.username}`);
                    this.ticketManager.server.update();
                    this.ticketManager.client.manager.debug(`[TICKET] ${member.displayName} has closed ${this.channel.name} by ${this.member.displayName}`);
                }, 5000);
            } catch (err) {
                this.ticketManager.client.manager.debug(err.message);
                resolve(false);
            }
        });
    }

    async save() {
        Database.run(Database.ticketSaveQuery, this.id, this.member.id, this.number, this.base.id);
        this.ticketManager.server.update();
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

    async export() {
        const messages = await this.channel.messages.fetch({ limit: 100 }, false);
        messages.sort((a, b) => {
            return a.createdTimestamp - b.createdTimestamp
        });
        const users = new Discord.Collection();
        const messageJson = []
        for (const m of messages.values()) {
            if (!m.author) continue;
            var u = users.get(m.author);
            if (u) {
                users.set(m.author, ++u);
            } else {
                users.set(m.author, 1);
            }
            const attachments = [];
            for (const a of m.attachments.values()) {
                attachments.push({
                    url: a.url,
                    name: a.name,
                    size: a.size,
                    height: a.height,
                    width: a.width
                });
            }
            const reactions = [];
            for (const r of m.reactions.cache.values()) {
                if (r.partial) {
                    await r.fetch();
                }
                const rusers = await r.users.fetch();
                reactions.push({
                    id: r.emoji.id ? r.emoji.id : r.emoji.name,
                    name: r.emoji.name,
                    animated: r.emoji.animated,
                    count: rusers.size
                });
            }
            const embeds = [];
            for (const e of m.embeds) {
                let eObject = {}
                if (e.title) eObject.title = e.title;
                if (e.description) eObject.description = e.description;
                if (e.author) eObject.author = { name: e.author.name, url: e.author.url, iconURL: e.author.iconURL }
                if (e.fields.length) eObject.fields = e.fields;
                if (e.url) eObject.url = e.url;
                if (e.footer) eObject.footer = { text: e.footer.text, iconURL: e.footer.iconURL }
                if (e.thumbnail) eObject.thumbnail = { url: e.thumbnail.url, width: e.thumbnail.width }
                if (e.image) eObject.image = { url: e.image.url, height: e.image.height, width: e.image.height }
                if (e.timestamp) eObject.timestamp = e.timestamp;
                if (e.color) eObject.color = `#${e.color.toString(16)}`;
                embeds.push(eObject);
            }
            const components = [];
            for (const c of m.components) {
                components.push(c.toJSON());
            }
            let mObject = {
                discordData: {},
                attachments,
                reactions,
                embeds,
                components,
                user_id: m.author.id,
                bot: m.author.bot,
                verified: true,
                username: m.author.username,
                nick: m.member.nickname ? m.member.nickname : m.author.username,
                tag: m.author.tag,
                avatar: m.author.avatar,
                id: m.id,
                created: m.createdTimestamp,
                edited: m.edits.length > 1 ? m.edits[m.edits.length - 1].createdTimestamp : null,
            }
            if (m.content && m.content.length !== 0) {
                mObject.content = m.content;
            }
            messageJson.push(JSON.stringify(mObject));
        }
        users.sort((a, b) => {
            return b - a;
        });
        var format = 
`<league-info>
    League: ${this.guild.name} (${this.guild.id})
    Channel: ${this.channel.name} (${this.channel.id})
    Messages: ${messages.size}
<users> 
`;
        users.forEach((amt, mem) => {
            format += `    ${amt} - ${mem.tag} (${mem.id})\n`;
        })
        const channelExport = `let channel = ${JSON.stringify({
            name: this.channel.name,
            id: this.channel.id
        })};`;
        const serverExport = `let server = ${JSON.stringify({
            name: this.guild.name,
            id: this.guild.id,
            icon: this.guild.icon
        })};`;
        const messagesExport = `let messages = [${messageJson.join(',')}];`;
        format += `<script src="https://tickettool.xyz/transcript/transcript.bundle.min.obv.js"></script><script type="text/javascript">${channelExport}${serverExport}${messagesExport}window.Convert(messages, channel, server);</script>`

        const attachment = new Discord.MessageAttachment(Buffer.from(format, 'utf-8'), `ticket-${formatTicket(this.number)}.html`);
        if (this.ticketManager.server.modlog) {
            this.ticketManager.server.modlog.send(`Exported ticket-${formatTicket(this.number)}`, attachment);
        }
        await this.channel.send(`Exported ticket-${formatTicket(this.number)}`, attachment);
    }
}

module.exports = Ticket;