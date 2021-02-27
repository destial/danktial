
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
        case 'europe':
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
        case 'southafrica':
            timezone = 'Africa/Lubumbashi';
            break;
        case 'hongkong':
            timezone = 'Asia/Singapore';
            break;
        case 'singapore':
            timezone = 'Asia/Singapore';
            break;
        default:
            timezone = 'Etc/GMT+5';
            break;
    }
    return timezone;
}

module.exports = formatDiscordRegion;