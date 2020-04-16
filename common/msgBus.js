const QueryPackage = require("./msgUtils/QueryPackage");

class MsgBus {

    //Creates new message bus instance
    constructor() {
        const os = require("os");
        this._hostname = os.hostname();

        const uuidv4 = require('uuid').v4;
        this._generateGuid = uuidv4;

        //Broadcast subscribers
        this._localBroadcastSubs = [];

        //Query subscribers
        this._localQuerySubs = {};

        //Ids of sended but not answerd queries
        this._pendingLocalQuerys = new Map();
    }

    //Creates connection for Redis
    async init() {
        return new Promise(async (resolve, reject) => {
            const redis = require('redis');

            let connection = require("../redis-connection.json")

            let config = {
                port: connection.port,
                host: connection.host,
                password: connection.password,
                //db: connection.db,
            };

            this.subscriber = redis.createClient(config);

            this.subscriber.on("ready", () => {
                //Listen on broadcast and hostname channel
                this.subscriber.subscribe("broadcast");
                this.subscriber.subscribe(this._hostname);

                //Listen for error messages
                this.subscriber.on("error", function (error) {
                    console.error(error);
                });

                //Listen for messaages
                this.subscriber.on("message", (channel, message) => {
                    if (channel == "broadcast") {
                        this.notifyLocalSubscribers(JSON.parse(message));
                    } else if (channel == this._hostname) {
                        this.finishQuery(JSON.parse(message));
                    }
                });

                this.publisher = redis.createClient(config);
                this.publisher.on("ready", () => resolve());
            });
        })
    }

    //Parameters: callBack - function to be subscribed
    //Subscribes a function which will be invoked on broadcast
    //Returns Promise<void>
    async subscribeBroadcast(callBack) {
        this._localBroadcastSubs.push(callBack);
    }

    //Parameters: subject - the purpose of the query, callBack - function to be subscribed
    //Subscribes a function which will be invoked on query
    //Returns Promise<void>
    async subscribeQuery(subject, callBack) {
        if (!this._localQuerySubs.hasOwnProperty(subject)) {
            this._localQuerySubs[subject] = [];
        }

        this._localQuerySubs[subject].push(callBack);
    }

    //Parameters: payload - object to send
    //Sends the payload to all broadcast subscribers
    //Returns Promise<void>
    async broadcast(payload) {
        this.publisher.publish("broadcast", JSON.stringify(payload));
    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object> - received answer
    query(subject, payload) {
        let promise = new Promise((resolve, reject) => {
            this.createQueryPackage(subject, payload, resolve)
                .then((queryPackage) => this.publisher.publish("broadcast", JSON.stringify(queryPackage)))
        });

        return promise;
    }

    async createQueryPackage(subject, payload, resolve) {
        let id = this._generateGuid();

        this._pendingLocalQuerys.set(id, resolve);

        let queryPackage = new QueryPackage(subject, payload, id, this._hostname);

        return queryPackage;
    }

    async finishQuery(resultPackage) {
        let result = resultPackage.result;
        let id = resultPackage["query-id"];

        let resolve = this._pendingLocalQuerys.get(id);

        if (typeof resolve !== 'undefined') {
            resolve(result);

            this._pendingLocalQuerys.delete(id);
        }
    }

    async notifyLocalSubscribers(payload) {
        let isQuery = payload.hasOwnProperty("query-id");

        if (isQuery) {
            this.notifyLocalQuerySubscribers(payload);
        } else {
            this.notifyLocalBroadcastSubscribers(payload);
        }
    }

    async notifyLocalBroadcastSubscribers(payload) {
        this._localBroadcastSubs.forEach(sub => {
            sub(payload);
        });
    }

    async notifyLocalQuerySubscribers(queryPackage) {
        let query = queryPackage.query;

        //TODO check whether there is valid querySub
        if (!this._localQuerySubs.hasOwnProperty(query)) {
            //throw Error("Not registered query subject!");
        }

        let payload = queryPackage.payload;
        let node = queryPackage.node;

        //TODO callBacks may be time consuming
        let callBacks = this._localQuerySubs[query];
        callBacks.forEach(callBack => {
            let result = callBack(payload);
            queryPackage.result = result;
    
            this.publisher.publish(node, JSON.stringify(queryPackage));
        });
    }
}

module.exports = MsgBus;
