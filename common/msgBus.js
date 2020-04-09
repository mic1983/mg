/*
   With Redis Pub/Sub will be implementd
   two main message channels - system and service.
*/
const NRP = require('node-redis-pubsub');

class MsgBus {

    //Creates new message bus instance
    constructor() {
        const os = require("os"); 
        this._hostname = os.hostname();

        //Broadcast subscribers
        this._broadcastSubs = [];

        //Query subscribers
        this._querySubs = {};
        
        //Ids of sended but not answerd queries
        this._pendingQuerys = new Map();
    }

    //Creates connection for Redis
    init() {
        return new Promise(async (resolve, reject) => {

            let connection = require("../redis-connection.json")

            let config = {
                port: connection.port,
                host: connection.host,
                auth: connection.auth,
                scope: connection.scopes.service
            };

            this.nrp = new NRP(config);

            await this.nrp.on(this._hostname, (payload) => this.finishQuery(payload))
            this.nrp.on("broadcast", (payload) => this.notifyLocalSubscribers(payload), () => resolve());
        })
    }

    //Parameters: callBack - function to be subscribed
    //Subscribes a function which will be invoked on broadcast
    //Returns Promise<void>
    async subscribeBroadcast(callBack) {
        this._broadcastSubs.push(callBack);
    }

    //Parameters: subject - the purpose of the query, callBack - function to be subscribed
    //Subscribes a function which will be invoked on query
    //Returns Promise<void>
    async subscribeQuery(subject, callBack) {
        if (!this._querySubs.hasOwnProperty(subject)) {
            this._querySubs[subject] = [];
        }

        this._querySubs[subject].push(callBack);
    }

    //Parameters: payload - object to send
    //Sends the payload to all broadcast subscribers
    //Returns Promise<void>
    async broadcast(payload) {
        await this.nrp.emit("broadcast", payload);
    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object> - received answer
    query(subject, payload) {
        let promise =  new Promise((resolve, reject) => {
            this.createQueryPackage(subject, payload, resolve)
                .then((queryPackage) => this.nrp.emit("broadcast", queryPackage))
        });

        return promise;
    }

    async createQueryPackage(subject, payload, resolve) {
        let id = await MsgBus.generateGuid();

        this._pendingQuerys.set(id, resolve);

        let queryPackage = {
            "query": subject,
            "payload": payload,
            "query-id": id,
            "node": this._hostname
        };

        return queryPackage;
    }

    async finishQuery(resultPackage) {
        let result = resultPackage.result;
        let id = resultPackage["query-id"];

        let resolve = this._pendingQuerys.get(id);

        resolve(result);

        this._pendingQuerys.delete(id);
    }

    async notifyLocalSubscribers(payload) {
        let isQuery = payload.hasOwnProperty("query-id");

        if (isQuery) {
            await this.notifyLocalQuerySubscribers(payload);
        } else {
            await this.notifyLocalBroadcastSubscribers(payload);
        }
    }

    async notifyLocalBroadcastSubscribers(payload) {
        this._broadcastSubs.forEach(sub => {
            sub(payload);
        });
    }

    async notifyLocalQuerySubscribers(queryPackage) {
        let query = queryPackage.query;
        let node = queryPackage.node;
        let payload = queryPackage.payload;

        //TODO check whether there is valid querySub
        if (!this._querySubs.hasOwnProperty(query)) {
            //throw Error("Not registered query subject!");
        }

        let callBack = this._querySubs[query][0];
        let result = callBack(payload);

        let resultPackage = {
            "query": query,
            "payload": payload,
            "query-id": queryPackage["query-id"],
            "node": node,
            "result": result
        };

        await this.nrp.emit(node, resultPackage);
    }

    static async generateGuid() {
        const uuidv4 = require('uuid').v4;
        let id = uuidv4();

        return id;
    }
}

module.exports = MsgBus;