//TODO log service
class LogService{
  async log(message, arg) {
    const process = require('process');
    if(typeof arg !== 'undefined' && arg !== null){
      console.log(`[${process.uptime()*1000}] ${message} {${arg}}`);
    }
    else {
    console.log(`[${process.uptime()*1000}] ${message}`);
    }
  }
}
module.exports.LogService = LogService;