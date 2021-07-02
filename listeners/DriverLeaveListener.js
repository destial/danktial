const ServerManager = require('../managers/ServerManager');
const Discord = require('discord.js');

module.exports = {
    /**
     * 
     * @param {Discord.Client} client 
     * @param {ServerManager} servers 
     */
    async run(client, servers) {
        try {
            client.on('guildMemberRemove', async (member) => {
                const server = await servers.fetch(member.guild.id);
                if (server) {
                    for (const tier of server.getTierManager().tiers.values()) {
                        const reserve = tier.getReserve(member.id);
                        if (reserve) {
                            await reserve.delete();
                            tier.removeReserve(member.id);
                            reserve.setTier(undefined);
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === reserve.tier) {
                                    await attendance.fix();
                                }
                            });
                            continue;
                        }
                        const driver = tier.getDriver(member.id);
                        if (driver) {
                            await driver.delete();
                            tier.removeDriver(member.id);
                            driver.team.removeDriver(member.id);
                            driver.setTeam(undefined);
                            driver.setTier(undefined);
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === driver.tier) {
                                    await attendance.fix();
                                }
                            });
                        }
                        
                    }
                }
            });
        } catch(err) {
            console.log(err);
        }
    }
};