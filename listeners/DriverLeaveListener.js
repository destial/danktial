module.exports = {
    async run(client, servers) {
        try {
            client.on('guildMemberRemove', async (member) => {
                const server = await servers.fetch(member.guild.id);
                if (server) {
                    for (const tier of server.getTierManager().tiers.values()) {
                        const reserve = tier.getReserve(member.id);
                        if (reserve) {
                            reserve.delete();
                            tier.removeReserve(member.id);
                            reserve.setTier(undefined);
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === reserve.tier) {
                                    attendance.fix();
                                }
                            });
                            continue;
                        }
                        const driver = tier.getDriver(member.id);
                        if (driver) {
                            driver.delete();
                            tier.removeDriver(member.id);
                            driver.team.removeDriver(member.id);
                            driver.setTeam(undefined);
                            driver.setTier(undefined);
                            server.getAttendanceManager().getAdvancedEvents().forEach(async attendance => {
                                if (attendance.tier === driver.tier) {
                                    attendance.fix();
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