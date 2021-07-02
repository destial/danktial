const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'tier',
    usage: '[ dupe | add | remove | clear | list ]',
    description: `The main command for all tier setup`,
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
            switch (args[0].toLowerCase()) {
                case 'dupe': {
                    const setting = args.shift();
                    client.commands.get('dupetier').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'add': {
                    const setting = args.shift();
                    client.commands.get('addtier').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'remove': {
                    const setting = args.shift();
                    client.commands.get('removetier').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'clear': {
                    const setting = args.shift();
                    client.commands.get('cleartier').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'list': {
                    const setting = args.shift();
                    client.commands.get('tiers').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
            }
        }
    }
};