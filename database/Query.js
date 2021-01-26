class Query {
    /**
     * 
     * @param {string} query 
     * @param  {string[]} args 
     */
    constructor(query, args) {
        this.query = query;
        this.args = args || [];
    }
}

module.exports = Query;