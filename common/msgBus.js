/*
   Има 2 основни транспорт-а. локален и разпределен. 
   При локален изпратените съобщения не се рутират извън процеса. 
   При разпределен ще се използва Redis Pub/Sub(ще обясня допълнително). 

   Трябва да има два основни топика - system и service.
   */
class MsgBus {
    #broadcastSubs;

    constructor() {
        this.#broadcastSubs = [];
    }

    //Връща комуникатор с помощта, на който услугата може да изпраща различен тип съобщения.
    async init() {

    }

    //{"source": "discovery", "system": "ping"}
    //Приема метод който се извиква при получаване на broadcast, не връща резултат.
    subscribeBroadcast(callBack) {
        this.#broadcastSubs.push(callBack);
    }

    //Приема метод който се извиква след получаване на query, не връща резултат.
    subscribeQuery(query, callBack) {

    }

    //{"source": "discovery", "system": "pong", "host": "hostname", "name": "microservice name", uptime: 12.22}
    //Параметри: payload - метод който изпраща съобщения и не чака отговор
    broadcast(payload) {
        this.#broadcastSubs.forEach(sub => {
            sub(payload);
        });
    }

    //Параметри: subject - получател, payload. Връща Promise, който resolve-a  с отговора или reject-ва с грешка.
    query(subject, payload) {

    }
}