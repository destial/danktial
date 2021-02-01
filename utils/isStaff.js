const Discord = require('discord.js');

/**
 * 
 * @param {Discord.GuildMember} member
 * @returns {boolean}
 */
function isStaff(member) {
    return (member.hasPermission('MANAGE_CHANNELS') || 
    member.hasPermission('MANAGE_MESSAGES') || 
    member.hasPermission('KICK_MEMBERS') || 
    member.hasPermission('MANAGE_GUILD') || 
    member.hasPermission('BAN_MEMBERS') || 
    member.hasPermission('MANAGE_ROLES') || 
    member.hasPermission('VIEW_AUDIT_LOG'));
}

module.exports = isStaff;