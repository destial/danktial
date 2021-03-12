const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'team',
    usage: '[ add | remove | edit ]',
    description: `The main command for all team setup`,
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
                await message.channel.send(embed);
                return;
            }
            switch (args[0].toLowerCase()) {
                case 'add': {
                    const setting = args.shift();
                    await client.commands.get('addteam').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'remove': {
                    const setting = args.shift();
                    await client.commands.get('removeteam').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'edit': {
                    const setting = args.shift();
                    await client.commands.get('editteam').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
            }
        }
    }
};