// const Gate = require("./common/gate")


class Gate {
    async init() {
       
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });
        
        this.io.on('connection', socket => {
            console.log('function connected');
        });
        
        this.http.listen(3000, () => {
            console.log('listening on *:3000');
        });
        this.io.on('disconnect', () => {
            console.log('function disconnected');
        })
    }
    constructor(){
        this.app = require('express')();
        this.http = require('http').createServer(this.app);
        this.io = require('socket.io')(this.http);
        
    }
}
let gate = new Gate();
gate.init();