const Discord = require('discord.js');
const Server = require('../items/Server');
const isStaff = require('../utils/isStaff');

module.exports = {
    name: 'driver',
    usage: '[ set | remove | transfer ]',
    description: `The main command for all driver setup`,
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
                message.channel.send({ embeds: [embed] });
                return;
            }
            switch (args[0].toLowerCase()) {
                case 'set': {
                    const setting = args.shift();
                    client.commands.get('setdriver').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'remove': {
                    const setting = args.shift();
                    client.commands.get('removedriver').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
                case 'transfer': {
                    const setting = args.shift();
                    client.commands.get('transfer').run(client, server, `${command} ${setting}`, args, message);
                    break;
                }
            }
        }
    }
};