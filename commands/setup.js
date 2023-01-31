const Discord = require('discord.js');
const Server = require('../items/Server');
const Team = require('../items/Team');
const Tier = require('../items/Tier');
const isStaff = require('../utils/isStaff');
const parseInt = require('../utils/parseInt');

module.exports = {
    name: 'setup',
    usage: '',
    description: 'Setup tiers and teams',
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
            if (server.getTierManager().tiers.size !== 0) {
                embed.setTitle('You already have at least 1 existing tier! This command is only used for setup!');
                message.channel.send({ embeds: [embed] });
                return;
            }
            embed.setTitle(`This is the start of setup. React with 🇩 to setup a default league, or 🇨 for custom teams.`)
            .setDescription(
            `A default league means each tier will have 10 teams according to the F1 game.
            E.g. Mercedes, Ferrari ... Williams`);
            const reply = await message.channel.send({ embeds: [embed] });
            await reply.react('🇩');
            await reply.react('🇨');
            let filter = (r, u) => (r.message.id === reply.id && u.id === message.member.id && (r.emoji.name === '🇨' || r.emoji.name === '🇩')); 
            const replyCollector = reply.createReactionCollector(filter, {
                max: 1, time: 60000
            });
            replyCollector.on('collect', (reaction, user) => {
                replyCollector.stop();
            });
            replyCollector.once('end', async (collection) => {
                const reaction = collection.first();

                if (reaction) {
                    if (reaction.emoji.name === '🇩') {
                        const embed3 = new Discord.MessageEmbed()
                            .setTitle('How many tiers do you want to have? Reply with a number, not a word!')
                            .setColor('RED');
                        await message.channel.send({ embeds: [embed3] });
                        let cFilter = (m) => (m.author.id === message.member.id);
                        const messageCollector = message.channel.createMessageCollector(cFilter, {
                            max: 1, time: 5*60000
                        });

                        messageCollector.on('collect', m => {
                            messageCollector.stop();
                        });

                        messageCollector.once('end', async (col) => {
                            const reply1 = col.first();
                            if (reply1) {
                                if (parseInt(reply1.content) && parseInt(reply1.content) !== 0) {
                                    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                                    const tierAmount = parseInt(reply1.content);
                                    embed3.setTitle('What do you want to name each tier as?');
                                    embed3.setDescription('Common names are as follows:\n' +
                                    `Tier {number}, Split {number}, Division {number}, Group {letter}
                                    As of this instant, only acceptable placeholders are {number} and {letter}
                                    This means each tier will be named Tier 1, Tier 2, etc or Split A, Split B, etc.
                                    Reply with [name] {placeholder}. E.g Tier {letter}
                                    *If you use the letter placeholder, you only have a limit of ${letters.length} tiers`);
                                    await message.channel.send({ embeds: [embed3] });

                                    let ccFilter = (m) => (m.author.id === message.member.id);
                                    const tierCollector = message.channel.createMessageCollector(ccFilter, {
                                        max: 1, time: 5*60000
                                    });

                                    tierCollector.on('collect', m => {
                                        tierCollector.stop();
                                    });

                                    tierCollector.once('end', async (collected) => {
                                        const reply4 = collected.first();
                                        if (reply4) {
                                            const tierName = reply4.content;
                                            if (tierName.includes('{letter}')) {
                                                if (tierAmount > letters.length) {
                                                    const embed2 = new Discord.MessageEmbed().setTitle('Too many tiers! Use {number} placeholder instead!')
                                                    .setColor('RED');
                                                    message.channel.send({ embeds: [embed2] });
                                                    return;
                                                }
                                            }
                                            if (!tierName.includes('{number}') && !tierName.includes('{letter}') && tierAmount > 1) {
                                                const embed6 = new Discord.MessageEmbed().setTitle('Please include a {number} or {letter} placeholder in your tier names!')
                                                .setColor('RED');
                                                message.channel.send({ embeds: [embed6] });
                                                return;
                                            }
                                            if (tierName.length >= 256) {
                                                const embed6 = new Discord.MessageEmbed().setTitle(`Tier name cannot be longer than 256 characters!`)
                                                .setColor('RED');
                                                message.channel.send({ embeds: [embed6] });
                                                return;
                                            }
                                            const promise = new Promise(async (resolve1, reject) => {
                                                /**
                                                 * @type {Discord.Collection<string, string>}
                                                 */
                                                const teamNames = new Discord.Collection();
                                                teamNames.set('Mercedes-AMG Petronas', 'https://cdn.discordapp.com/emojis/801293471440175105.png');
                                                teamNames.set('Scuderia Ferrari', 'https://cdn.discordapp.com/emojis/801293471355895829.png');
                                                teamNames.set('Redbull Racing', 'https://cdn.discordapp.com/emojis/801293470668554241.png');
                                                teamNames.set('Aston Martin F1', 'https://cdn.discordapp.com/emojis/801293860432773182.png');
                                                teamNames.set('Alpine F1', 'https://cdn.discordapp.com/emojis/801293860403544084.png');
                                                teamNames.set('McLaren F1', 'https://cdn.discordapp.com/emojis/801293470484398120.png');
                                                teamNames.set('Haas F1 Team', 'https://cdn.discordapp.com/emojis/801293861027577856.png');
                                                teamNames.set('Scuderia Alpha Tauri', 'https://cdn.discordapp.com/emojis/801293860411932683.png');
                                                teamNames.set('Alfa Romeo F1', 'https://cdn.discordapp.com/emojis/801293861648465991.png');
                                                teamNames.set('Williams Racing', 'https://cdn.discordapp.com/emojis/801293860470521856.png');
                                                for (var i = 1; i <= tierAmount; i++) {
                                                    const tierPromise = new Promise(async (resolve2, reject) => {
                                                        const tier = new Tier(client, server, tierName.replace('{number}', String(i)).replace('{letter}', letters[i]));
                                                        server.log(`${message.member.user.tag} has created tier ${tier.name}`);
                                                        const teamPromise = new Promise(async (resolve3, reject) => {
                                                            var addEmoji = false;
                                                            var numOfEmoji = 50;
                                                            switch (server.guild.premiumTier) {
                                                                case 1:
                                                                    numOfEmoji += 50;
                                                                    break;
                                                                case 2:
                                                                    numOfEmoji += 100;
                                                                    break;
                                                                case 3:
                                                                    numOfEmoji += 200;
                                                                    break;
                                                                default:
                                                                    break;
                                                            }
                                                            const remainingSlots = numOfEmoji - server.guild.emojis.cache.size;
                                                            if (remainingSlots >= 10) {
                                                                //addEmoji = true;
                                                            }
                                                            teamNames.forEach(async (image, name) => {
                                                                var newName = name;
                                                                if (addEmoji) {
                                                                    const emojiName = `dt${name.toLowerCase().replace(' ', '').replace('-', '')}`;
                                                                    var emoji = server.guild.emojis.cache.find(e => e.name === emojiName);
                                                                    try {
                                                                        if (!emoji) emoji = await server.guild.emojis.create(image, emojiName);
                                                                        if (emoji) {
                                                                            newName = `${emoji} ${name}`;
                                                                        }
                                                                    } catch(err) {
                                                                        emoji = await server.guild.emojis.create(image, emojiName);
                                                                        if (emoji) {
                                                                            newName = `${emoji} ${name}`;
                                                                        }
                                                                    }
                                                                }
                                                                const team = new Team(client, server, newName, tier);
                                                                tier.addTeam(team);
                                                                if (name === teamNames.lastKey()) {
                                                                    resolve3();
                                                                }
                                                            });
                                                        });
                                                        teamPromise.then(async () => {
                                                            server.getTierManager().addTier(tier);
                                                            await tier.save();
                                                            await tier.saveTeams();
                                                            resolve2();
                                                        });
                                                    });
                                                    tierPromise.then(() => {});
                                                    if (i === tierAmount) resolve1();
                                                }
                                            });
                                            promise.then(async () => {
                                                const embed4 = new Discord.MessageEmbed()
                                                    .setTitle(`You have successfully created ${tierAmount} tiers!`)
                                                    .setDescription(`To continue setup for drivers per team per tier, please use the ${server.prefix}setdriver command!`)
                                                    .setColor('RED');
                                                message.channel.send({ embeds: [embed4] });
                                                server.save();
                                                server.getTierManager().tiers.sort((a, b) => a.name.localeCompare(b.name));
                                            });
                                        } else {
                                            const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                                            embed2.setColor('RED');
                                            message.channel.send({ embeds: [embed2] });
                                        }
                                    });
                                } else {
                                    const embed2 = new Discord.MessageEmbed().setTitle('Not a number or cannot have 0 tiers!');
                                    embed2.setColor('RED');
                                    message.channel.send({ embeds: [embed2] });
                                }
                            } else {
                                const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                                embed2.setColor('RED');
                                message.channel.send({ embeds: [embed2] });
                            }
                        });
                    } else if (reaction.emoji.name === '🇨') {
                        const embed6 = new Discord.MessageEmbed();
                        embed6.setTitle('You currently do not have premium!');
                        embed6.setDescription('Only premium guilds have this option!');
                        embed6.setColor('RED');
                        message.channel.send({ embeds: [embed6] });
                    }
                } else {
                    const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                    embed2.setColor('RED');
                    message.channel.send({ embeds: [embed2] });
                }
            });
        }
    }
};