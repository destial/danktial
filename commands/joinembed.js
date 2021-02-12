const Discord = require('discord.js');
const Database = require('../database/Database');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');
const parseInt = require('../utils/parseInt');

module.exports = {
    name: 'joinembed',
    usage: '< "send" >',
    description: 'Creates an embed to send to new users',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member)) {
            if (!args.length) {
                const embed = new Discord.MessageEmbed();
                embed.setColor('RED');

                embed.setAuthor(`This is the start of the embed creator. You will get to create custom embeds to send to individual member's DMs that join this server. Here is an example:`);

                const exampleEmbed = new Discord.MessageEmbed();
                exampleEmbed.setTitle(`This is an example title`);
                exampleEmbed.setColor('BLUE');
                exampleEmbed.setDescription('This is an example description');
                exampleEmbed.addFields([
                    { name: 'Field 1', value: 'Value 1 : Inline', inline: true },
                    { name: 'Field 2', value: 'Value 2 : Inline', inline: true },
                    { name: 'Field 3', value: 'Value 3 : Not Inline', inline: false },
                ]);
                exampleEmbed.setThumbnail('https://media.discordapp.net/attachments/406814017743486978/809648422176948224/thumbnailexample.png');
                exampleEmbed.setFooter('This is an example footer');

                const createdEmbed = new Discord.MessageEmbed();

                await message.member.user.send(embed);
                await message.member.user.send(exampleEmbed);
                embed.setAuthor(`Now, what would you like the title to be?`);
                embed.setDescription(`You can't skip this part!`);

                const dm = await message.member.user.send(embed);
                let filter = (m) => m.author.id === message.member.id;
                const titleCollector = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                titleCollector.once('end', async (titleCollection) => {
                    if (titleCollection.size !== 0 && titleCollection.first().content) {
                        createdEmbed.setTitle(titleCollection.first().content.length > 256 ? `${titleCollection.first().content.substring(0, 2052)}...` : titleCollection.first().content);
                        embed.setAuthor(`What would you like the description to be?`);
                        embed.setDescription('Type `skip` to skip this');
                        await message.member.user.send(embed);

                        const descCollector = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                        descCollector.once('end', async (descCollection) => {
                            if (descCollection.size !== 0 && descCollection.first().content) {
                                if (descCollection.first().content.toLowerCase() !== 'skip') {
                                    createdEmbed.setDescription(descCollection.first().content.length > 2048 ? `${descCollection.first().content.substring(0, 2044)}...` : descCollection.first().content);
                                }
                                embed.setAuthor(`How many fields to you want?`);
                                embed.setDescription('Type `skip` to skip this');
                                await message.member.user.send(embed);

                                const fieldAmount = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                fieldAmount.once('end', async (fieldAmountCollection) => {
                                    if (fieldAmountCollection.size !== 0 && fieldAmountCollection.first().content) {
                                        var amount = 0;
                                        if (fieldAmountCollection.first().content.toLowerCase() !== 'skip') {
                                            amount = parseInt(fieldAmountCollection.first().content);
                                        }
                                        if (amount > 0) {
                                            const embedFieldData = await askFields(message.member, dm.channel, amount);
                                            console.log(embedFieldData);
                                            createdEmbed.addFields(embedFieldData);
                                        }
                                        
                                        embed.setAuthor('What would you like the thumbnail to be?');
                                        embed.setDescription('You can enter in a valid URL or send an attachment image. Type `skip` to skip this');
                                        await message.member.user.send(embed);

                                        const thumbnailCollector = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                        thumbnailCollector.once('end', async (thumbnailCollection) => {
                                            if (thumbnailCollection.size !== 0 && thumbnailCollection.first()) {
                                                const thumbnailMessage = thumbnailCollection.first();
                                                if (thumbnailMessage.content && isImageURL(thumbnailMessage.content) && thumbnailMessage.content.toLowerCase() !== 'skip') {
                                                    createdEmbed.setThumbnail(thumbnailMessage.content);
                                                } else if (thumbnailMessage.attachments) {
                                                    const attachment = getAttachment(thumbnailMessage.attachments);
                                                    createdEmbed.setThumbnail(attachment[0]);
                                                }

                                                embed.setAuthor('What would you like the footer to say?');
                                                embed.setDescription('Type `skip` to skip this');
                                                await message.member.user.send(embed);

                                                const footerCollector = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                                footerCollector.once('end', async (footerCollection) => {
                                                    if (footerCollection.size !== 0 && footerCollection.first().content) {
                                                        if (footerCollection.first().content !== 'skip') {
                                                            createdEmbed.setFooter(footerCollection.first().content.length > 2048 ? `${footerCollection.first().content.substring(0, 2044)}...` : footerCollection.first().content);
                                                        }

                                                        const colors = [
                                                            'DEFAULT', 'WHITE', 'AQUA', 'GREEN', 'BLUE', 'YELLOW', 
                                                            'PURPLE', 'LUMINOUS VIVID PINK', 'GOLD', 'ORANGE', 'RED',
                                                            'GRAY', 'DARKER GRAY', 'NAVY', 'DARK AQUA', 'DARK GREEN',
                                                            'DARK BLUE', 'DARK PURPLE', 'DARK VIVID PINK', 'DARK GOLD',
                                                            'DARK ORANGE', 'DARK RED', 'DARK GREY', 'LIGHT GREY',
                                                            'DARK NAVY', 'BLURPLE', 'GREYPLE', 'DARK BUT NOT BLACK',
                                                            'NOT QUITE BLACK', 'RANDOM'
                                                        ];
                                                        var colorList = '';
                                                        var colorCounter = 1;
                                                        colors.forEach(color => {
                                                            colorList += `(${colorCounter++}) ${color}\n`;
                                                        });
                                                        embed.setAuthor('You are almost done! The last one is the color! Choose what color should the embed be (Enter the number not the color!):');
                                                        embed.setDescription(colorList);

                                                        await message.member.user.send(embed);
                                                        const colorCollector = dm.channel.createMessageCollector(filter, { max: 1, time: 60000 });
                                                        colorCollector.once('end', async (colorCollection) => {
                                                            if (colorCollection.size !== 0 && colorCollection.first().content) {
                                                                const colorNumber = parseInt(colorCollection.first().content);
                                                                if (colorNumber) {
                                                                    createdEmbed.setColor(colors[colorNumber-1].replace(' ', '_'));
                                                                }

                                                                embed.setAuthor('All done!');
                                                                embed.setDescription('This is what it looks like:');
                                                                await message.member.user.send(embed);
                                                                await message.member.user.send(createdEmbed);
                                                                server.loadEmbed(createdEmbed);
                                                                await Database.run(Database.serverEmbedSaveQuery, [message.guild.id, JSON.stringify(createdEmbed.toJSON())]);
                                                                console.log(`[EMBEDS] Saved embed from ${message.guild.id}`);
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            } else if (args[0].toLowerCase() === 'send') {
                if (server.joinEmbed) {
                    await message.member.user.send(server.joinEmbed);
                } else {
                    const embed = new Discord.MessageEmbed();
                    embed.setColor('RED');
                    embed.setAuthor(`You don't have a join embed set!`);
                    await message.member.user.send(embed);
                }
            }
        }
    }
};

/**
 * 
 * @param {Discord.GuildMember} member 
 * @param {Discord.DMChannel} channel 
 * @param {number} amount
 * @returns {Promise<Discord.EmbedFieldData[]>}
 */
async function askFields(member, channel, amount) {
    if (amount === 0) {
        return [];
    }
    return new Promise(async (resolve, reject) => {
        amount--;
        const embed = new Discord.MessageEmbed();
        var qCounter = 0;
        /**
         * @type {string[]}
         */
        const answers = [];
        const questions = [
            `Enter field name`,
            `Enter value name`,
            `Inline or not? Answer with (Y/N)`
        ];
        embed.setAuthor(questions[qCounter++]);
        embed.setDescription(`You can't skip this part!`);
        embed.setColor('RED');
        await channel.send(embed);

        var embedFieldData = [];

        let filter = (m) => m.author.id === member.id;
        const fieldCollector = channel.createMessageCollector(filter, { max: questions.length, time: 60000 });
        fieldCollector.on('collect', async (m) => {
            if (m.content) {
                answers.push(m.content);
            }
            if (qCounter < questions.length) {
                embed.setAuthor(questions[qCounter++]);
                await channel.send(embed);
            }
        });
        fieldCollector.once('end', async () => {
            const fieldData = {
                name: answers[0].length > 256 ? `${answers[0].substring(0, 252)}...` : answers[0],
                value: answers[1].length > 1024 ? `${answers[1].substring(0, 1020)}...` : answers[1],
                inline: (typeof answers[2] == "string" && answers[2].toLowerCase().startsWith('y') ? true : false)
            };
            embedFieldData.push(fieldData);
            const data = await askFields(member, channel, amount);
            data.forEach(d => {
                embedFieldData.push(d);
            });
            resolve(embedFieldData);
        });
    });
}

/**
 * 
 * @param {Discord.Collection<string, Discord.MessageAttachment>} attachments 
 */
function getAttachment(attachments) {
	const valid = /^.*(gif|png|jpg|jpeg)$/g;
	return attachments.array()
		.filter(attachment => valid.test(attachment.proxyURL))
		.map(attachment => attachment.proxyURL);
}

/**
 * 
 * @param {string} url 
 */
function isImageURL(url) {
    const valid = /^.*(gif|png|jpg|jpeg)$/g;
    return url.startsWith('http') && 
        valid.test(url);
}