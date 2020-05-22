class GateService {
    async init(msgBus, log) {

        this.logService = log;
        this.msgBus = msgBus;
        const PORT = 3000;

        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });
        
        this.io.on('connection', socket => {
            this.logService.log('client connected');

            socket.on('message', (payload) => {
                this.logService.log('message: ' + payload);

                //todo emit in msgBus

                this.msgBus.query(payload.service, payload.query)
                .then(res => {
                    this.io.emit(message, res);
                })
                
              });
        });
        
        this.http.listen(PORT, () => {
            this.logService.log('GateService initialised on port ' + PORT);
        });

        this.io.on('disconnect', () => {
            this.logService.log('client disconnected');
        })

        return this;
    }
    constructor(){
        this.app = require('express')();
        this.http = require('http').createServer(this.app);
        this.io = require('socket.io')(this.http);
    }
}

module.exports = GateService;