class Query {
    constructor(query, args) {
        this.query = query;
        this.args = args || [];
    }
}

module.exports = Query;