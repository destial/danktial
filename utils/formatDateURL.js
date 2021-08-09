/**
 * 
 * @param {Date} date 
 */
function formatDateURL(date) {
    return `https://www.timeanddate.com/worldclock/converter.html?iso=${date.getUTCFullYear()}${date.getUTCMonth() + 1 > 9 ? date.getUTCMonth() + 1 : `0${date.getUTCMonth() + 1}`}${date.getUTCDate() > 9 ? date.getUTCDate() : `0${date.getUTCDate()}`}T${date.getUTCHours() > 9 ? date.getUTCHours() : `0${date.getUTCHours()}`}${date.getUTCMinutes() > 9 ? date.getUTCMinutes() : `0${date.getUTCMinutes()}`}${date.getUTCSeconds() > 9 ? date.getUTCSeconds() : `0${date.getUTCSeconds()}`}&p1=1440`;
}

module.exports = formatDateURL;