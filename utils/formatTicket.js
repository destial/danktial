/**
 * 
 * @param {number} number 
 */
function formatTicket(number) {
    var s = String(number);
    while (s.length < 4) {
        s = "0" + s;
    }
    return s;
}

module.exports = formatTicket;