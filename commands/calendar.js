const Discord = require('discord.js');
const Server = require('../items/Server');
const formatFormalTime = require('../utils/formatFormatTime');
const { timezoneNames } = require('../utils/timezones');

module.exports = {
    name: 'calendar',
    aliases: [],
    usage: '[ tier ]',
    description: 'Shows the race calendar for that tier',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        const embed = new Discord.MessageEmbed();
        embed.setColor('RED');
        if (!args.length) {
            embed.setAuthor('Usage is:');
            embed.setDescription(`${server.prefix}${command} ${this.usage}`);
            embed.setFooter(this.description);
            message.channel.send({ embeds: [embed] });
            return;
        }
        const tier = server.getTierManager().getTier(args.join(" "));
        if (!tier) {
            embed.setAuthor(`Invalid tier name of ${args.join(" ")}`);
            message.channel.send({ embeds: [embed] });
            return;
        }
        if (tier.races.length === 0) {
            embed.setAuthor(`This tier does not have a calendar set!`);
            message.channel.send({ embeds: [embed] });
            return;
        }
        embed.setAuthor(`Calendar of ${tier.name}`);
        for (var i = 0; i < 24 && i < tier.races.length; i++) {
            const race = tier.races[i];
            var name = `${race.date.toLocaleDateString('en-US', { timeZone: timezoneNames.get(race.timezone), weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${formatFormalTime(race.date, race.timezone)}`;
            if (race.results.length || race.qualifying.length) {
                name = `${name}\n[Link to results](https://www.destial.xyz/leagues/${server.id}/tiers/${tier.name.split(' ').join('_')}/races/${i+1})`;
            }
            embed.addField(race.name, name, false);
        }
        if (tier.races.length > 24) {
            embed.setFooter('More races not shown');
        }
        message.channel.send({ embeds: [embed] });
    }
};