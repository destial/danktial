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
                    server.getTierManager().tiers.every(async tier => {
                        const driver = tier.getDriver(member.id);
                        if (driver) {
                            tier.removeDriver(member.id);
                            driver.team.removeDriver(member.id);
                            driver.setTeam(undefined);
                            driver.setTier(undefined);
                            await driver.delete();
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === driver.tier) {
                                    await attendance.fix();
                                }
                            });
                            return false;
                        }
                        const reserve = tier.getReserve(member.id);
                        if (reserve) {
                            tier.removeReserve(member.id);
                            reserve.setTier(undefined);
                            await reserve.delete();
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === reserve.tier) {
                                    await attendance.fix();
                                }
                            });
                            return false;
                        }
                        return true;
                    });
                }
            });
        } catch(err) {
            console.log(err);
        }
    }
};