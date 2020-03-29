 /*
    Има 2 основни транспорт-а. локален и разпределен. 
    При локален изпратените съобщения не се рутират извън процеса. 
    При разпределен ще се използва Redis Pub/Sub(ще обясня допълнително). 

    Трябва да има два основни топика - system и service.
    */
   var MsgBus = {
    //Връща комуникатор с помощта, на който услугата може да изпраща различен тип съобщения.
    init: () => {
        this.broadcastSubs = [];
        this.querySubs = {};
        return MsgBus;
    },
    //{"source": "discovery", "system": "ping"}
    //Приема метод който се извиква при получаване на broadcast, не връща резултат.
    subscribeBroadcast: (callBack) => {
        this.broadcastSubs.push(callBack);
    },
    //Приема метод който се извиква след получаване на query, не връща резултат.
    subscribeQuery: (query, callBack) => {
        // if (!(query in this.querySubs)) {
        //     //creates new arr for callbacks for this query
        //     this.querySubs[query] = [];
        // }

        // this.querySubs[query].push(callBack);
    },
    //{"source": "discovery", "system": "pong", "host": "hostname", "name": "microservice name", uptime: 12.22}
    //Параметри: payload - метод който изпраща съобщения и не чака отговор
    broadcast: (payload) => {
        this.broadcastSubs.forEach(sub => {
            sub(payload);
        });
    },
    //Параметри: subject - получател, payload. Връща Promise, който resolve-a  с отговора или reject-ва с грешка.
    query(subject, payload) {
        
    }
}