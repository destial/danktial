const Discord = require('discord.js');
const Server = require('../items/Server');

module.exports = {
    name: 'help',
    usage: '< command >',
    description: 'Displays the help command',
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
        const desc = [];
        const list = new Discord.Collection();
        client.commands.forEach(k => {
            const has = list.find(c => c === k);
            if (!has) {
                if (k.name !== 'announce') {
                    list.set(k.name, k);
                    desc.push(k.description);
                }
            } 
        });
        const commands = list.keyArray();
        if (!args.length) {
            embed.setAuthor('Here are the available commands:');
            var help = "";
            for (var i = 0; i < commands.length; i++) {
                help += ("`" + server.prefix+commands[i] + "` => " + desc[i] + '\n');
            }
            embed.setDescription(help);
            message.channel.send(embed);
        } else {
            const command = list.get(args[0].toLowerCase());
            if (command) {
                embed.setAuthor('Usage for this command is:');
                embed.setDescription(`${server.prefix}${command.name} ${command.usage}`);
                if (command.aliases && command.aliases.length) {
                    embed.addField('Aliases', command.aliases.join(', '), false);
                }
                if (command.example) {
                    embed.addField('Example', `${server.prefix}${command.name} ${command.example}`, false);
                }
                message.channel.send(embed);
            }
        }
    }
};