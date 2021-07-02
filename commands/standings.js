const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'standings',
    aliases: [],
    usage: '[ d | c ] [ tier ]',
    description: 'Shows the current season standings for that tier',
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
            message.channel.send(embed);
            return;
        }
        const s = args.shift().toLowerCase();
        const tier = server.getTierManager().getTier(args.join(" "));
        if (!tier) {
            embed.setAuthor(`Invalid tier name of ${args.join(" ")}`);
            message.channel.send(embed);
            return;
        }
        if (tier.races.length === 0) {
            embed.setAuthor(`This tier does not have a calendar set!`);
            message.channel.send(embed);
            return;
        }
        switch (s) {
            case 'd': {
                embed.setAuthor(`Driver Standings for ${tier.name}`);
                const drivers = [];
                const reserves = [];
                for (const team of tier.teams) {
                    for (const driver of team[1].drivers) {
                        drivers.push({
                            driver: driver[1],
                            points: 0
                        });
                    }
                }
                for (const reserve of tier.reserves) {
                    reserves.push({
                        driver: reserve[1],
                        points: 0
                    });
                }
                for (const race of tier.races) {
                    for (const result of race.results) {
                        var object = drivers.find(d => d.driver.id === result.driver.id);
                        if (!object) {
                            object = reserves.find(r => r.driver.id === result.driver.id);
                        }
                        if (!object) continue;
                        object.points += result.points;
                    }
                }
                drivers.sort((a, b) => b.points - a.points);
                reserves.sort((a, b) => b.points - a.points);
                var builder = '';
                for (var i = 0; i < drivers.length; i++) {
                    builder += `${i + 1} • **${drivers[i].points} points** • ${drivers[i].driver.name} *(${drivers[i].driver.team.name})*\n`;
                }
                builder += `~~---------------------------------~~\n`;
                for (var i = 0; i < reserves.length; i++) {
                    builder += `${i + 1} • **${reserves[i].points} points** • ${reserves[i].driver.name} *(Reserve)*\n`;
                }
                if (builder === '') {
                    embed.setDescription(`Your tier is empty!`);
                    break;
                }
                embed.setDescription(builder.length > 2048 ? `${builder.substr(0, 2044)}•••` : builder);
                break;
            }
            case 'c': {
                embed.setAuthor(`Constructor Standings for ${tier.name}`);
                const teams = [];
                for (const team of tier.teams) {
                    teams.push({
                        team: team[1],
                        points: 0
                    });
                }
                for (const race of tier.races) {
                    for (const result of race.results) {
                        const object = teams.find(t => t.team.drivers.find(d => d.id === result.driver.id));
                        if (!object) continue;
                        object.points += result.points;
                    }
                }
                teams.sort((a, b) => b.points - a.points);
                var builder = '';
                for (var i = 0; i < teams.length; i++) {
                    builder += `${i + 1} • **${teams[i].points} points** • ${teams[i].team.name}\n`;
                }
                if (builder === '') {
                    embed.setDescription(`Your tier is empty!`);
                    break;
                }
                embed.setDescription(builder.length > 2048 ? `${builder.substr(0, 2044)}•••` : builder);
                break;
            }
            default: {
                embed.setAuthor('Usage is:');
                embed.setDescription(`${server.prefix}${command} ${this.usage}`);
                embed.setFooter(this.description);
                break;
            }
        }
        message.channel.send(embed);
    }
};