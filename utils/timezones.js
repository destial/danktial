const { Collection } = require("discord.js");

/**
 * @type {Collection<string, string>}
 */
const timezones = new Collection();
timezones.set('AEDT (Australian Daylight Saving Time UTC+11)', '+11:00');
timezones.set('AEST (Australian Eastern Standard Time UTC+10)', '+10:00');
timezones.set('SGT (Singapore Standard Time UTC+8)', '+08:00');
timezones.set('NZST (New Zealand Standard Time UTC+12)', '+12:00');
timezones.set('UTC (Coordinated Universal Time UTC+0)', '+00:00'); 
timezones.set('GMT (Greenwich Standard Time UTC+0)', '+00:00');
timezones.set('BST (British Standard Time UTC+1)', '+01:00');
timezones.set('EST (Eastern Standard Time UTC-5)', '-05:00');
timezones.set('CST (Central Standard Time UTC-6)', '-06:00');
timezones.set('CDT (Central Daylight Time UTC-7)', '-07:00');
timezones.set('CEST (Central European Summer Time UTC+2)', '+02:00');
timezones.set('PDT (Pacific Daylight Time UTC-7)', '-07:00');
timezones.set('PST (Pacific Standard Time UTC-8)', '-08:00');
timezones.set('IST (Indian Standard Time UTC+5:30)', '+5:30');
timezones.set('CSTA (Central Asia Time UTC+6)', '+06:00');
timezones.set('JST (Japan Standard Time UTC+9)', '+09:00');
timezones.set('KST (Korea Standard Time UTC+9)', '+09:00');
timezones.set('AST (Argentina Standard Time UTC-3)', '-03:00');
timezones.set('SAST (South African Standard Time UTC+2)', '+02:00');

/**
 * @type {Collection<string, string>}
 */
const timezoneNames = new Collection();
timezoneNames.set('AEDT', 'Etc/GMT-11');
timezoneNames.set('SGT', 'Asia/Singapore');
timezoneNames.set('AEST', 'Australia/Canberra');
timezoneNames.set('NZST', 'Antarctica/South_Pole');
timezoneNames.set('UTC', 'Etc/GMT');
timezoneNames.set('GMT', 'Etc/GMT');
timezoneNames.set('BST', 'Etc/GMT-1');
timezoneNames.set('EST', 'Etc/GMT+5');
timezoneNames.set('CST', 'Etc/GMT+6');
timezoneNames.set('CDT', 'Etc/GMT+7');
timezoneNames.set('PDT', 'Etc/GMT+7');
timezoneNames.set('PST', 'Etc/GMT+8');
timezoneNames.set('CEST', 'Etc/GMT-2');
timezoneNames.set('IST', 'Asia/Calcutta');
timezoneNames.set('CSTA', 'Asia/Almaty');
timezoneNames.set('JST', 'Asia/Tokyo');
timezoneNames.set('KST', 'Asia/Seoul');
timezoneNames.set('AST', 'America/Argentina/Jujuy');
timezoneNames.set('SAST', 'Africa/Lubumbashi');

module.exports = { 
    timezones,
    timezoneNames
};