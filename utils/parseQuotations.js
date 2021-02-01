/**
 * 
 * @param {string} str 
 * @returns {string[]}
 */
function parseQuotations(str) {
    const arguments = [];
    while (true) {
        var num = str.indexOf('"');
        if (num === -1) {
            num = str.indexOf('”');
        }
        if (num === -1) {
            num = str.indexOf('“');
        }
        if (num === -1) {
            break;
        }
        str = str.substring(num+1);
        num = str.indexOf('"');
        if (num === -1) {
            num = str.indexOf('“');
        }
        if (num === -1) {
            num = str.indexOf('”');
        }
        const arg = str.substring(0, num);
        if (arg === " " || arg === "") continue;
        arguments.push(arg);
    }
    return arguments;
}

module.exports = parseQuotations;