const Discord = require('discord.js');
const Server = require('../items/Server');
const AttendanceManager = require('../managers/AttendanceManager');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'poll',
    usage: `"What's Your Favorite Color?" "Blue" "Red" "Yellow"`,
    description: 'Creates a poll',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (!isStaff(message.member)) {
            return;
        }
        return new Promise(async (resolve, reject) => {
            const { channel } = message;
            const embed = new Discord.MessageEmbed();
            if (!args.length) {
                embed.setDescription(`**Usage:**\n\n**Multi answers (1-20)**\n${server.prefix}${this.name} ${this.usage}\n**Yes / No**\n${server.prefix}${this.name} "Do you like this bot?"`);
                channel.send(embed);
                reject();
            } else {
                const reactions = ["🇦", "🇧","🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"];
                var str = args.join(" ");
                var arguments = [];
                while (true) {
                    var num = str.indexOf('"');
                    if (num === -1) break;
                    str = str.substring(num+1);
                    num = str.indexOf('"');
                    const arg = str.substring(0, num);
                    if (arg === " " || arg === "") continue;
                    arguments.push(arg);
                }
                if (!arguments.length) {
                    embed.setDescription(`**Usage:**\n\n**Multi answers (1-20)**\n${server.prefix}poll "What's Your Favorite Color?" "Blue" "Red" "Yellow"\n**Yes / No**\n${prefix}poll "Do you like this bot?"`);
                    channel.send(embed);
                    reject();
                } else {
                    const question = arguments.shift().trim();
                    if (!arguments.length) {
                        embed.setDescription(`${AttendanceManager.accept} Yes\n${AttendanceManager.reject} No`);
                        embed.setTimestamp(new Date());
                        channel.send(`❔ **${question}**`, embed).then((message) => {
                            message.react(AttendanceManager.accept).then(() => {
                                message.react(AttendanceManager.reject);
                            });
                            resolve();
                        });
                    } else {
                        if (arguments.length > 20) {
                            embed.setDescription('You cannot have more than 20 options!');
                            channel.send(embed);
                            reject();
                        } else if (arguments.length <= 10) {
                            for (var counter = 0; counter < arguments.length; counter++) {
                                arguments[counter] = `${reactions[counter]} ${arguments[counter].trim()}`;
                            }
                            embed.setDescription(arguments.join('\n'));
                            embed.setTimestamp(new Date());
                            channel.send(`📊 **${question}**`, embed).then(async (message) => {
                                for (var i = 0; i < arguments.length; i++) {
                                    await message.react(reactions[i]);
                                }
                                resolve();
                                await message.delete({ timeout: 1000 });
                            });
                        } else if (arguments.length > 10) {
                            const firstPart = [];
                            const secondPart = [];
                            for (var i = 0; i < 10; i++) {
                                firstPart.push(`${reactions[i]} ${arguments[i]}`);
                            }
                            for (var ii = 10; ii < arguments.length; ii++) {
                                secondPart.push(`${reactions[ii-10]} ${arguments[ii]}`);
                            }
                            embed.setDescription(firstPart.join('\n'));
                            embed.setTimestamp(new Date());
                            channel.send(`📊 **${question}**`, embed).then(async (message) => {
                                for (var iii = 0; iii < firstPart.length; iii++) {
                                    await message.react(reactions[iii]);
                                }
                                embed.setDescription(secondPart.join('\n'));
                                embed.setTimestamp(new Date());
                                channel.send(`📊 **${question}**`, embed).then(async (mes) => {
                                    for (var iiii = 0; iiii < secondPart.length; iiii++) {
                                        await mes.react(reactions[iiii]);
                                    }
                                    resolve();
                                    await message.delete({ timeout: 1000 });
                                });
                            });
                        }
                    }
                }
            }
        });
    }
};