const { timezoneNames } = require("./timezones");

/**
 * Converts a date object to a formal time string representation with the given timezone
 * @param {Date} date 
 * @param {string} timezone 
 */
function formatFormalTime(date, timezone) {
    var timezoneName = timezoneNames.get(timezone.toUpperCase().trim());
    if (!timezoneName) timezoneName = 'Etc/GMT';
    const time = date.toLocaleTimeString('en-GB', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezoneName,
    }).toUpperCase().replace(' ', '');
    return `${(time.startsWith('0') ? time.substring(1): time)} ${timezone.toUpperCase().trim()}`;
}

module.exports = formatFormalTime;