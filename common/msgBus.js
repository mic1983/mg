/*
   With Redis Pub/Sub will be implementd
   two main message channels - system and service.
*/
class MsgBus {

    //Creates new message bus instance
    constructor() {
        //Broadcast subscribers
        this._broadcastSubs = [];
    }

    //Creates connection for Redis
    async init() {

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

    }

    //Parameters: payload - object to send
    //Sends the payload to all broadcast subscribers
    //Returns Promise<void>
    async broadcast(payload) {
        this._broadcastSubs.forEach(sub => {
            sub(payload);
        });
    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object[]> - array of all received answers
    async query(subject, payload) {

    }
}