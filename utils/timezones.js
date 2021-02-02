const { Collection } = require("discord.js");

/**
 * @type {Collection<string, string>}
 */
const timezones = new Collection();
timezones.set('AEDT', '+11');
timezones.set('SGT', '+08');
timezones.set('AEST', '+10');
timezones.set('UTC', '+00'); 
timezones.set('EST', '-05');
timezones.set('CST', '-06');

/**
 * @type {Collection<string, string>}
 */
const timezoneNames = new Collection();
timezoneNames.set('AEDT', 'Etc/GMT-11');
timezoneNames.set('SGT', 'Asia/Singapore');
timezoneNames.set('AEST', 'Australia/Canberra');
timezoneNames.set('UTC', 'Etc/GMT');
timezoneNames.set('EST', 'EST');
timezoneNames.set('CST', 'America/Chicago');

module.exports = { 
    timezones,
    timezoneNames
};