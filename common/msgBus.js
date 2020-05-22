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
    //Resolves with true if the connection is established correctly
    init(connectionSettings, log) {

        this.logService = log;
        let self = this;
        //TODO check connectionSettings type

        return new Promise(async (resolve, reject) => {
            const redis = require('redis');


            let config = {
                port: connectionSettings.port,
                host: connectionSettings.host,
                password: connectionSettings.password,
                //db: connectionSettings.db,
            };

            this._subscriber = redis.createClient(config);

            this._subscriber.on("ready", () => {
                //Listen on broadcast and hostname channel
                this._subscriber.subscribe("broadcast");
                this._subscriber.subscribe(this._hostname);

                //Listen for error messages
                this._subscriber.on("error", function (error) {
                    console.error(error);
                });

                //Listen for messaages
                this._subscriber.on("message", (channel, message) => {
                    if (channel == "broadcast") {
                        this.notifyLocalSubscribers(JSON.parse(message));
                    } else if (channel == this._hostname) {
                        this.finishQuery(JSON.parse(message));
                    }
                });

                this._publisher = redis.createClient(config);
                this._publisher.on("ready", () =>  {
                    this.logService.log('MessageBus initialised');
                    resolve(self);
                });
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
        this._publisher.publish("broadcast", JSON.stringify(payload));
    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object> - received answer
    query(subject, payload) {
        let promise = new Promise((resolve, reject) => {
            this.createQueryPackage(subject, payload, resolve)
                .then((queryPackage) => this._publisher.publish("broadcast", JSON.stringify(queryPackage)))
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
        let payload = queryPackage.payload;
        let node = queryPackage.node;

        let arg = new Object();
        arg.payload = payload;
        arg.subject = query;

        //TODO check whether there is valid querySub
        if (!this._localQuerySubs.hasOwnProperty(query)) {
            //throw Error("Not registered query subject!");
        } else {
            //TODO callBacks may be time consuming
            let callBacks = this._localQuerySubs[query];
            callBacks.forEach(async (callBack) => {
                let result = await callBack(arg);
                queryPackage.result = result;

                this._publisher.publish(node, JSON.stringify(queryPackage));
            });
        }

        //TODO check whether there is valid wildCard
        if (!this._localQuerySubs.hasOwnProperty("*")) {
            //throw Error("Not registered query subject!");
        } else {
            let callBacks = this._localQuerySubs["*"];
            callBacks.forEach(callBack => {
                let result = callBack(arg);
                queryPackage.result = result;

                this._publisher.publish(node, JSON.stringify(queryPackage));
            });
        }
    }
}

module.exports = MsgBus;
