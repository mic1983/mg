class QueryPackage {
    constructor(query, payload, id, node) {
        this.query = query;
        this.payload = payload;
        this["query-id"] = id;
        this.node = node;
        this.result = undefined;
    }
}

module.exports = QueryPackage;
