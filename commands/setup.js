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
            if (server.getTierManager().tiers.size !== 0) {
                embed.setTitle('You already have at least 1 existing tier! This command is only used for setup!');
                message.channel.send(embed);
                return;
            }
            embed.setTitle(`This is the start of setup. React with 🇩 to setup a default league, or 🇨 for custom teams.`)
            .setDescription(
            `A default league means each tier will have 10 teams according to the F1 game.
            E.g. Mercedes, Ferrari ... Williams`);
            const reply = await message.channel.send(embed);
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
                            .setTitle('How many tiers do you want to have? Reply with a number, not a word!');
                        
                        await message.channel.send(embed3);
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
                                    await message.channel.send(embed3);

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
                                                    const embed2 = new Discord.MessageEmbed().setTitle('Too many tiers! Use {number} placeholder instead!');
                                                    message.channel.send(embed2);
                                                    return;
                                                }
                                            }
                                            if (!tierName.includes('{number}') && !tierName.includes('{letter}')) {
                                                const embed6 = new Discord.MessageEmbed().setTitle('Please include a {number} or {letter} placeholder in your tier names!');
                                                message.channel.send(embed6);
                                                return;
                                            }
                                            const promise = new Promise(async (resolve1, reject) => {
                                                const teamNames = 
                                                    ['Mercedes-AMG Petronas', 'Scuderia Ferrari', 'Redbull Racing', 'Racing Point F1', 
                                                    'Renault F1', 'McLaren F1', 'Haas F1 Team', 'Scuderia Alpha Tauri',
                                                    'Alpha Romeo Sauber F1', 'Williams Racing'];
                                                console.log(tierAmount);
                                                for (var i = 1; i <= tierAmount; i++) {
                                                    const tierPromise = new Promise((resolve2, reject) => {
                                                        const tier = new Tier(client, server, tierName.replace('{number}', String(i)).replace('{letter}', letters[i]));
                                                        server.log(`${message.member.user.tag} has created tier ${tier.name}`);
                                                        const teamPromise = new Promise((resolve3, reject) => {
                                                            teamNames.forEach(async (name, index) => {
                                                                const team = new Team(client, server, name, tier);
                                                                await team.save();
                                                                tier.addTeam(team);
                                                                if (index === teamNames.length-1) resolve3();
                                                            });
                                                        });
                                                        teamPromise.then(async () => {
                                                            server.getTierManager().addTier(tier);
                                                            await tier.save();
                                                            console.log('new tier');
                                                            resolve2();
                                                        });
                                                    });
                                                    tierPromise.then(() => {});
                                                    if (i === tierAmount) resolve1();
                                                }
                                            });

                                            promise.then(() => {
                                                const embed4 = new Discord.MessageEmbed()
                                                    .setTitle(`You have successfully created ${tierAmount} tiers!`)
                                                    .setDescription(`To continue setup for drivers per team per tier, please use the ${server.prex}setdriver command!`);
                                                message.channel.send(embed4);
                                            });

                                        } else {
                                            const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                                            message.channel.send(embed2);
                                        }
                                    });
                                } else {
                                    const embed2 = new Discord.MessageEmbed().setTitle('Not a number or cannot have 0 tiers!');
                                    message.channel.send(embed2);
                                }
                            } else {
                                const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                                message.channel.send(embed2);
                            }
                        });
                    } else if (reaction.emoji.name === '🇨') {
                        const embed6 = new Discord.MessageEmbed();
                        embed6.setTitle('~~~ Work in progress ~~~');
                        embed6.setDescription('Feature will be available soon!');
                        message.channel.send(embed6);
                    }
                } else {
                    const embed2 = new Discord.MessageEmbed().setTitle('Ran out of time!');
                    message.channel.send(embed2);
                }
            });
        }
    }
};