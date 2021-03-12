const Discord = require('discord.js');
const Attendance = require('../items/Attendance');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'purge',
    aliases: ['clearchannel'],
    usage: '',
    description: 'Purges a channel',
    /**
     * @param {Discord.Client} client 
     * @param {Server} server 
     * @param {string} command 
     * @param {string[]} args 
     * @param {Discord.Message} message
     */
    async run(client, server, command, args, message) {
        if (isStaff(message.member) && message.member.hasPermission('MANAGE_MESSAGES')) {
            const embed = new Discord.MessageEmbed();
            embed.setColor('RED');
            embed.setAuthor('Do you want to purge this channel of messages?');
            const reply = await message.channel.send(embed);
            await reply.react(Attendance.accept);
            await reply.react(Attendance.reject);
            let filter = (r) => r.message.id === reply.id;
            const collector = reply.createReactionCollector(filter, { max: 1, time: 60000 });
            collector.on('collect', () => {
                collector.stop();
            });
            collector.once('end', async (collection) => {
                const reaction = collection.first();
                if (reaction && reaction.emoji.name === Attendance.accept) {
                    if (message.channel.type !== 'text') return;
                    var size = 0;
                    const promise = new Promise((resolve, reject) => {
                        if (message.channel.messages.cache.size === 0) resolve();
                        message.channel.messages.cache.forEach((m, id) => {
                            m.delete();
                            size++;
                            if (id === message.channel.messages.cache.last().id) resolve();
                        });
                    });
                    promise.then(async () => {
                        embed.setAuthor(`Purged ${size} messages`)
                        const reply = await message.channel.send(embed);
                        await reply.delete({ timeout: 5000 });
                    });
                } else {
                    embed.setAuthor('Did not purge this channel.');
                    message.channel.send(embed);
                }
            });
        }
    }
};