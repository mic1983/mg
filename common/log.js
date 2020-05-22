class LogService {
  async log(message, arg) {
    const process = require('process');

    var uptime = process.uptime();
    const date = new Date(uptime*1000);

    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const milliseconds = date.getUTCMilliseconds();

    const time = minutes +':'+ seconds +'.'+ milliseconds;

    if(typeof arg !== 'undefined' && arg !== null){
      console.log(`[${time}] ${message} {${arg}}`);
    }
    else {
    console.log(`[${time}] ${message}`);
    }
  }

  //same interface for initialisation for all services
  async init() {
    this.log("LogService initialised");
    return this;
  }
}

module.exports = LogService;
