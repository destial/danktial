const Discord = require('discord.js');
const Server = require('../items/Server');
const formatDiscordRegion = require('../utils/formatDiscordRegion');

module.exports = {
    name: 'announce',
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
            await message.channel.send(embed);
        }
    }
};