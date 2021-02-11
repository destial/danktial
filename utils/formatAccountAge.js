/**
 * 
 * @param {Date} createdAt 
 */
function formatAccountAge(createdAt) {
    const dateNow = new Date();
    var age = dateNow.getTime() - createdAt.getTime();
    var years = age / 31557600000;
    age -= Math.floor(years) * 31557600000;

    var months = age / 2629800000;
    age -= Math.floor(months) * 2629800000;

    var days = age / 86400000;
    age -= Math.floor(days) * 86400000;

    var hours = age / 3600000;
    age -= Math.floor(hours) * 3600000;

    var minutes = age / 60000;
    age -= Math.floor(minutes) * 60000;

    var seconds = age / 1000;
    age -= Math.floor(seconds) * 1000;

    years = Math.floor(years);
    months = Math.floor(months);
    minutes = Math.floor(minutes);
    hours = Math.floor(hours);
    days = Math.floor(days);
    seconds = Math.floor(seconds);
    
    var returnString = '';
    if (years) returnString += `${years} year${years > 1 ? 's' : ''}`;
    if (months) returnString += `, ${months} month${months> 1 ? 's' : ''}`;
    if (days) returnString += `, ${days} day${days > 1 ? 's' : ''}`;
    if (hours) returnString += `, ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes) returnString += `, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (seconds) returnString += `, ${seconds} second${seconds > 1 ? 's' : ''}`;

    if (returnString.trim().startsWith(',')) returnString = returnString.trim().substring(1).trim();
    const index = returnString.lastIndexOf(',');
    if (index !== -1) {
        const firstHalf = returnString.substring(0, index);
        const secondHalf = returnString.substring(index+2);
        returnString = `${firstHalf} and ${secondHalf}`; 
    }
    return returnString;
}

module.exports = formatAccountAge;