/**
 * Parses a string to an integer
 * @param {string} x
 */
function parseInt(x) {
    x = Number(x);
    return x >= 0 ? Math.floor(x) : Math.ceil(x);
}


module.exports = parseInt;