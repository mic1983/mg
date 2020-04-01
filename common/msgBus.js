/*
   With Redis Pub/Sub will be implementd
   two main message channels - system and service.
*/
class MsgBus {

    //Creates new message bus instance
    constructor() {

    }

    //Creates connection for Redis
    async init() {

    }

    //Parameters: callBack - function to invoke on broadcast
    //Subscribes a function which will be invoked on broadcast
    //Returns Promise<void>
    async subscribeBroadcast(callBack) {

    }

    //Parameters: subject - the purpose of the query, callBack - function to invoke on query
    //Subscribes a function which will be invoked on query
    //Returns Promise<void>
    async subscribeQuery(subject, callBack) {

    }

    //Parameters: payload - object to send
    //Sends the payload to all broadcast subscribers
    //Returns Promise<void>
    async broadcast(payload) {

    }

    //Parameters: subject - the purpose of the query, payload - object to send
    //Sends the payload to all subscribers to the specific query
    //Returns Promise<Object[]> - array of all received answers
    async query(subject, payload) {

    }
}