/*
   With Redis Pub/Sub will be implementd
   two main message channels - system and service.
*/
const NRP = require('node-redis-pubsub');

class MsgBus {

    //Creates new message bus instance
    constructor() {
        //Broadcast subscribers
        this._broadcastSubs = [];
        //Query subscribers
        this._querySubs = {};
        //Ids of sended but not answerd queries
        this._pendingQueryIds = [];
    }

    //Creates connection for Redis
    async init() {
        let connection = require("../redis-connection.json")

        let config = {
            port: connection.port,
            host: connection.host,
            auth: connection.auth,
            scope: connection.scopes.service
        };

        this.nrp = new NRP(config);

        await this.nrp.on("broadcast", (payload) => this.notifySubscribers(payload));
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
        //Change callBack with msgBus function
        await this.nrp.on(subject, callBack);
    }

    //Parameters: payload - object to send
    //Sends the payload to all broadcast subscribers
    //Returns Promise<void>
    async broadcast(payload) {
        await this.nrp.emit("broadcast", payload);
    }

    async notifySubscribers(payload) {
        this._broadcastSubs.forEach(sub => {
            sub(payload);
        });
    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object> - received answer
    async query(subject, payload) {
        let queryPackage = await this.createQueryPackage(subject, payload);
        console.log(queryPackage);

        await this.nrp.emit(subject, payload);
    }

    async createQueryPackage(subject, payload) {
        let hostname = await MsgBus.getHostname();
        let id = await MsgBus.generateGuid();

        this._pendingQueryIds.push(id);

        let queryPackage = {
            "query": subject,
            "payload": payload,
            "query-id": id,
            "node": hostname
        };

        return queryPackage;
    }

    async finishQuery(id) {
        let index = this._pendingQueryIds.indexOf(id);

        if (index > -1) {
            array.splice(index, 1);
        }
        else {
            throw Error("Can't find query!");
        }
    }
    
    static async getHostname() {
        const os = require("os");
        let hostname = os.hostname();

        return hostname;
    }

    static async generateGuid() {
        const uuidv4 = require('uuid').v4;
        let id = uuidv4();

        return id;
    }
}

module.exports = MsgBus;