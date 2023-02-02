const Discord = require('discord.js');
const fs = require('fs');
const ServerManager = require('../managers/ServerManager');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        client.commands = new Discord.Collection();
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            client.commands.set(command.name.toLowerCase(), command);
            if (command.aliases) {
                command.aliases.forEach((alias) => {
                    client.commands.set(alias.toLowerCase(), command);
                });
            }
        }

        client.on('ready', async () => {
            for (const guild of client.guilds.cache.values()) {
                const commands = await guild.commands.fetch();
                for (const command of client.commands.values()) {
                    if (!command.interaction || command.description.includes("BOT OWNER"))
                        continue;

                    const options = await getCommandOptions(guild, command);
                    const existing = commands.find((v) => v.name === command.name);
                    if (existing) {
                        existing.edit({ description: command.description, options });
                        continue;
                    }
                    guild.commands.create({ name: command.name, description: command.description, options });
                }
            }
        });

        client.on('serverUpdate', async (server) => {
            const commands = await server.guild.commands.fetch();

            for (const clientcommand of client.commands.values()) {
                if (!clientcommand.interaction)
                    continue;
                
                const guild = server.guild;
                const guildcommand = commands.find(c => c.name === clientcommand.name);
                if (guildcommand) {
                    const options = await getCommandOptions(guild, clientcommand);
                    guildcommand.edit({ options });
                }
            }
        });

        async function getCommandOptions(guild, command) {
            /// REGISTER GUILD COMMAND
            /**
             * @type {string}
             */
            const usage = command.usage;
            const server = await servers.fetch(guild.id);
            const options = [];
            const args = usage.split(' ');
            for (const arg of args) {
                var optionname = arg;
                const choices = [];
                var description = '';
                var required = true;
                var type = 'STRING';

                if (arg.startsWith('<')) {
                    required = false;
                }

                optionname = optionname.substring(1, optionname.length - 1);
                optionname = optionname.split('"').join('').trim();
                if (optionname.startsWith("@")) {
                    type = 'USER';
                    optionname = optionname.substring(1);
                    description = 'The user/driver';
                } else if (optionname.startsWith("#")) {
                    type = 'CHANNEL';
                    optionname = optionname.substring(1);
                    description = 'The channel';
                } else if (optionname === 'number') {
                    type = 'NUMBER';
                    description = 'The number';
                } else if (optionname === 'tier') {
                    for (const tier of server.getTierManager().tiers.values()) {
                        if (choices.length === 25) break;
                        choices.push({ name: tier.name, value: tier.name });
                    }
                    description = 'The tier';
                } else if (optionname === 'team') {
                    for (const tier of server.getTierManager().tiers.values()) {
                        for (const team of tier.teams.values()) {
                            if (choices.find(g => g.name === team.name)) continue;
                            if (choices.length === 25) break;
                            choices.push({ name: team.name, value: team.name });
                            
                        }
                    }
                    description = 'The team';
                } else if (optionname.startsWith('attendance')) {
                    for (const event of server.getAttendanceManager().getAdvancedEvents().values()) {
                        if (choices.length === 25) break;
                        choices.push({ name: event.embed.title, value: event.id });
                    }
                    description = 'The event message';
                } else if (optionname.startsWith('command')) {
                    for (const cmd of client.commands.keys()) {
                        if (choices.length === 25) break;
                        choices.push({ name: cmd, value: cmd });
                    }
                    description = 'The command';
                }

                options.push({
                    type,
                    name: optionname,
                    choices,
                    required,
                    description
                });
            }

            return options;
        }
        
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) 
                return;
            
            const cmd = client.commands.get(interaction.commandName);
            if (cmd && cmd.interaction) {
                if (cmd.ephemeral) {
                    await interaction.deferReply({ ephemeral: true });
                }
                await cmd.interaction(client, await servers.fetch(interaction.guildId), interaction);
            }
        });
        
        client.on('messageCreate', async (message) => {
            if (!message.author) return;
            if (message.author.bot) return;
            if (!message.guild) return;
            const msg = message.content;
            const server = await servers.fetch(message.guild.id);
            if (server) {
                if (message.content.startsWith(server.prefix)) {
                    const args = msg.slice(server.prefix.length).split(' ');
                    const command = args.shift().toLowerCase();
                    try {
                        if (client.commands.has(command)) {
                            client.commands.get(command).run(client, server, command, args, message);
                        }
                    } catch (err) {}
                }
            }
        });
    }
};