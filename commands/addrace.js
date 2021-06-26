const Discord = require('discord.js');
const Race = require('../items/Race');
const Server = require('../items/Server');
const formatDate = require('../utils/formatDate');
const isStaff = require('../utils/isStaff');
const parseQuotations = require('../utils/parseQuotations');

module.exports = {
    name: 'addrace',
    aliases: [],
    usage: '"tier" "race name" "date"',
    description: 'Shows the race calendar for that tier',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            if (!args.length) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send(embed);
                return;
            }
            const arguments = parseQuotations(args.join(" "));
            if (arguments.length < 3) {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                message.channel.send(embed);
                return;
            }
            const tier = server.getTierManager().getTier(arguments[0]);
            if (!tier) {
                embed.setAuthor(`Invalid tier name of ${arguments[0]}`);
                message.channel.send(embed);
                return;
            }
            try {
                const date = await formatDate(arguments[2]);
                const race = new Race(tier, arguments[1], date, arguments[2].substring(arguments[2].length - 4).trim());
                tier.races.push(race);
                tier.races.sort((a, b) => a.date.getTime() - b.date.getTime());
                embed.setAuthor(`Added race ${race.name} to the calendar of ${tier.name}`);
                server.save();
            } catch {
                embed.setAuthor(`Invalid date of ${arguments[2]}`);
                embed.setDescription(`Format is: DD/MM/YYYY HH:MM TMZE`);
            }
            await message.channel.send(embed);
        }
    }
};