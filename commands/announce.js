const Discord = require('discord.js');
const Database = require('../database/Database');
const Query = require('../database/Query');
const Server = require('../items/Server');
const formatDiscordRegion = require('../utils/formatDiscordRegion');

module.exports = {
    name: 'announce',
    aliases: ['backup', 'issue'],
    usage: '[ title | description ]',
    description: '*ONLY FOR BOT OWNER*',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (command === 'issue') {
            if (!args.length) {
                const embed = new Discord.MessageEmbed();
                embed.setColor('RED');
                embed.setAuthor(`Usage is:`);
                embed.setDescription(`${server.prefix}issue <issue>`);
                message.channel.send(embed);
                return;
            }
            const issue = args.join(' ');
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            embed.setAuthor(`${message.author.tag} in ${server.guild.name}`);
            embed.setDescription(issue.length > 2048 ? `${issue.substr(0, 2044)}...` : issue);
            embed.setTimestamp(new Date());
            client.guilds.cache.get('406814017743486976').channels.cache.get('859412282257571880').send(`<@237492876374704128>`, embed);
            const replyEmbed = new Discord.MessageEmbed();
            replyEmbed.setColor('RED');
            replyEmbed.setAuthor('Successfully reported an issue!');
            message.channel.send(replyEmbed);
            return;
        }
        if (message.member.id === '237492876374704128') {
            if (command === 'announce') {
                if (!args.length) {
                    message.channel.send(`Usage is ${server.prefix}${this.name} ${this.usage}`);
                    return;
                }
                const joined = args.join(' ');
                const titleDesc = joined.split('|');
                const title = titleDesc[0];
                const desc = titleDesc[1];
                const embed = new Discord.MessageEmbed();
                embed.setAuthor(message.member.user.username, message.member.user.avatarURL(), 'https://www.destial.xyz');
                embed.setTitle(title).setColor('RED');
                if (desc) {
                    embed.setDescription(desc);
                }
                server.serverManager.servers.forEach(sv => {
                    try {
                        const locale = formatDiscordRegion(sv.guild.region);
                        const date = new Date().toLocaleDateString('en-US', { timeZone: locale, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                        const time = new Date().toLocaleTimeString('en-US', { timeZone: locale, hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
                        embed.setFooter(`${date} • ${(time.startsWith('0') ? time.substring(1) : time)} • ${sv.guild.region.toLocaleUpperCase()}`);
                        if (sv.guild.publicUpdatesChannel && sv.guild.publicUpdatesChannel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) {
                            sv.guild.publicUpdatesChannel.send(embed);
                        }
                        sv.modlog.send(embed);
                        console.log(`[ANNOUNCEMENT] Sent announcement to ${sv.guild.name}`);
                    } catch (err) {
                        message.channel.send(`Error sending announcement to ${sv.guild.name}`);
                        console.err(err);
                    }
                });
                message.channel.send(embed);
            } else if (command === 'backup') {
                const embed = new Discord.MessageEmbed();
                embed.setAuthor('Backing up data now!');
                embed.setColor('RED');
                message.channel.send(embed);
                const queries = [];
                server.serverManager.servers.forEach(server => {
                    const query = new Query('REPLACE INTO servers (id,data) VALUES (?,?)', [server.id, JSON.stringify(server.toJSON())]);
                    queries.push(query);
                });
                const d = Database.multipleRunNewDB(queries);
                d.then(() => { 
                    embed.setAuthor('Successfully backed up data!');
                    message.channel.send(embed);
                }).catch((err) => {
                    client.guilds.cache.get('406814017743486976').channels.cache.get('646237812051542036').send(err.message);
                })
            }
        }
    }
};