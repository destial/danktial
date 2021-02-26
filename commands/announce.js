const Discord = require('discord.js');
const Database = require('../database/Database');
const Query = require('../database/Query');
const Server = require('../items/Server');
const formatDiscordRegion = require('../utils/formatDiscordRegion');

module.exports = {
    name: 'announce',
    aliases: ['backup'],
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
        if (message.member.id === '237492876374704128' && message.guild.id === '406814017743486976') {
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
                embed.setAuthor(message.member.user.username, message.member.user.avatarURL(), 'http://danktial.destial.xyz');
                embed.setTitle(title)
                    .setColor('RED');
                if (desc) {
                    embed.setDescription(desc);
                }
                message.channel.startTyping();
                server.serverManager.servers.forEach(async server => {
                    if (server.modlog) {
                        const locale = formatDiscordRegion(server.guild.region);
                        const date = new Date().toLocaleDateString('en-US', { timeZone: locale, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                        const time = new Date().toLocaleTimeString('en-US', { timeZone: locale, hour12: true, hour: '2-digit', minute: '2-digit' }).replace(' ', '').toLowerCase();
                        embed.setFooter(`${date} • ${(time.startsWith('0') ? time.substring(1) : time)} • ${server.guild.region.toLocaleUpperCase()}`);
                        await server.modlog.send(embed);
                        console.log(`[ANNOUNCEMENT] Sent announcement to ${server.guild.name}`);
                    }
                });
                message.channel.stopTyping();
                await message.channel.send(embed);
            } else if (command === 'backup') {
                const embed = new Discord.MessageEmbed();
                embed.setAuthor('Backing up data now!');
                embed.setColor('RED');
                await message.channel.send(embed);
                const queries = [];
                server.serverManager.servers.forEach(server => {
                    const query = new Query('REPLACE INTO servers (id,data) VALUES (?,?)', [server.id, JSON.stringify(server.toJSON())]);
                    queries.push(query);
                });
                await Database.multipleRunNewDB(queries);
                embed.setAuthor('Successfully backed up data!');
                await message.channel.send(embed);
            }
        }
    }
};