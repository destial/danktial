/**
 * Converts a date object to a formal time string representation with the given timezone
 * @param {Date} date 
 * @param {string} timezone 
 */
function formatFormalTime(date, timezone) {
    var hours = date.getHours();
    var mins = date.getMinutes();
    if (timezone.toUpperCase() === "AEDT") {
        hours = hours + 3;
    } else if (timezone.toUpperCase() === "AEST") {
        hours = hours + 2;
    }
    var unit = (hours >= 12 && hours < 24 ? "PM" : "AM");
    hours = (hours > 12 && hours < 24 ? hours - 12 : (hours > 24 ? hours - 24 : hours));
    mins = (mins < 10 ? "0" : "") + mins;

    return (`${hours}:${mins}${unit} ${timezone.toUpperCase()}`);
}

module.exports = formatFormalTime;