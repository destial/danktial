
/**
 * 
 * @param {string} region 
 * @returns {string} IANA Timezone
 */
function formatDiscordRegion(region) {
    var timezone = 'Asia/Singapore';
    switch (region.toLowerCase()) {
        case 'sydney':
            timezone = 'Australia/Sydney';
            break;
        case 'brazil':
            timezone = 'America/Campo_Grande';
            break;
        case 'eruope':
            timezone = 'Etc/GMT';
            break;
        case 'india':
            timezone = 'Asia/Calcutta';
            break;
        case 'japan':
            timezone = 'Asia/Tokyo';
            break;
        case 'russia':
            timezone = 'Europe/Kirov';
            break;
        case 'south africa':
            timezone = 'Africa/Lubumbashi';
            break;
        case 'hong kong':
            break;
        case 'singapore':
            break;
        default:
            timezone = 'Etc/GMT+5';
            break;
    }
    return timezone;
}

module.exports = formatDiscordRegion;