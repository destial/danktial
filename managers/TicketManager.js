const Ticket = require('../items/Ticket');
const TicketPanel = require('../items/TicketPanel');
const Server = require('../items/Server');
const formatTicket = require('../utils/formatTicket');
const Database = require('../database/Database');
const Discord = require('discord.js');
const { Logger } = require('../utils/Utils');

class TicketManager {
    /**
     * @param {Discord.Client} client
     * @param {Server} server 
     */
    constructor(client, server) {
        this.client = client;
        /**
         * @type {Discord.Collection<string, TicketPanel>}
         */
        this.ticketpanels = new Discord.Collection();
        /**
         * @type {Discord.Collection<string, Ticket>}
         */
        this.opentickets = new Discord.Collection();
        /**
         * @type {number}
         */
        this.totaltickets = 0;
        this.server = server;
    }

    static get emoji() { return "📩"; }
    static get lock() { return "🔒"; }

    /**
     * @param {Discord.Client} client
     * @param {Discord.TextChannel} channel
     * @param {string} title 
     */
    async addTicketPanel(client, channel, title) {
        const embed = new Discord.MessageEmbed();
        embed.setAuthor(title, client.user.avatarURL());
        embed.setColor('RED');
        embed.setDescription(`To create a report, react with ${TicketManager.emoji}`);
        try {
            const panelMessage = await channel.send({ embeds: [embed] });
            panelMessage.react(TicketManager.emoji);
            const ticketPanel = new TicketPanel(client, this, panelMessage.id, embed, channel);
            this.ticketpanels.set(ticketPanel.id, ticketPanel);
            Database.run(Database.ticketPanelSaveQuery, [panelMessage.id, channel.id]);
            this.server.update();
            Logger.info(`[TICKETPANEL] Added ticket panel ${ticketPanel.id}`);
        } catch (err) {
            Logger.warn(`[TICKETPANEL] Something happened while creating a ticket panel!`, err);
        }
    }

    /**
     * 
     * @param {TicketPanel} panel 
     */
    async loadTicketPanel(panel) {
        this.ticketpanels.set(panel.id, panel);
        Logger.boot(`[TICKETPANEL] Loaded ticket panel ${panel.id} from ${this.server.guild.name}`);
    }

    /**
     * 
     * @param {string} id 
     */
    async removeTicketPanel(id) {
        const deleted = this.ticketpanels.delete(id);
        if (deleted) {
            try {
                Database.run(Database.ticketPanelDeleteQuery, [id]);
                this.server.update();
                Logger.info(`[TICKETPANEL] Deleted ticket panel ${id} from ${this.server.guild.name}`);
            } catch (err) {
                Logger.warn(`[TICKETPANEL] Something happened while removing a ticket panel!`, err);
            }
        }
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @param {string} reason
     * @param {Discord.ClientUser} clientuser
     */
    async newTicket(member, reason, clientuser) {
        return new Promise(async (resolve, reject) => {
            try {
                var category = this.server.guild.channels.cache.find(c => c.name.toLowerCase().includes('tickets') && c.type === 'category');
                if (!category) {
                    category = await this.server.guild.channels.create('tickets', {
                        type: 'category',
                        permissionOverwrites: [{
                                id: this.server.guild.roles.everyone.id,
                                deny: ['VIEW_CHANNEL']
                            }, {
                                id: clientuser.id,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY']
                            }]
                    });
                    const roles = this.server.guild.roles.cache.filter(r => r.permissions.has('KICK_MEMBERS') || r.name.toLowerCase().includes('steward'));
                    roles.forEach(async (r) => {
                        await category.createOverwrite(r.id, {
                            SEND_MESSAGES: true,
                            READ_MESSAGE_HISTORY: true,
                            VIEW_CHANNEL: true
                        });
                    });
                }
                const ticketChannel = await this.server.guild.channels.create(`ticket-${formatTicket(++this.totaltickets)}`, {
                    type: 'text',
                    permissionOverwrites: [{
                            id: this.server.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL']
                        }, {
                            id: member.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'ATTACH_FILES']
                        }, {
                            id: clientuser.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY']
                        }],
                    parent: category
                });
                const roles = this.server.guild.roles.cache.filter(r => r.permissions.has('KICK_MEMBERS') || r.name.toLowerCase().includes('steward'));
                roles.forEach(async (r) => {
                    await ticketChannel.createOverwrite(r.id, {
                        SEND_MESSAGES: true,
                        READ_MESSAGE_HISTORY: true,
                        VIEW_CHANNEL: true
                    });
                });
                if (this.server.modlog) {
                    this.server.modlog.send(new Discord.MessageEmbed()
                        .setAuthor(`${member.displayName} has created ${ticketChannel.name}`)
                        .setTimestamp()
                        .setColor('GREEN'));
                }
                const baseMessage = await ticketChannel.send(`${member} here's your ticket!`, new Discord.MessageEmbed()
                    .setAuthor(`${member.displayName} has created a ticket!`)
                    .setDescription(`Reason: ${reason ? reason: "None"}`)
                    .setColor('RED'));
                baseMessage.react(TicketManager.lock);
                const ticket = new Ticket(member, this.totaltickets, ticketChannel, baseMessage, this);
                this.opentickets.set(ticket.id, ticket);
                ticket.save();
                Logger.info(`[TICKET] Created ${ticket.channel.name} by ${ticket.member.displayName}`);
                resolve(ticket);
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }

    /**
     * 
     * @param {Ticket} ticket 
     */
    async loadTicket(ticket) {
        this.opentickets.set(ticket.id, ticket);
        Logger.boot(`[TICKET] Loaded ticket ${ticket.channel.name} from ${this.server.guild.name}`);
    }

    /**
     * @param {string} id
     */
    fetchTicket(id) {
        return this.opentickets.find((t) => t.channel.id === id);
    }
}

module.exports = TicketManager;