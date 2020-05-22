const LogService = require("./common/log");
const MessageBus = require("./common/msgBus");
const GateService = require("./services/GateService/gate");
const HenryService = require("./services/henry");
const RossService = require("./services/ross");

const connectionSettings = require("./redis-settings.json")

async function main() {
    const log = await (new LogService()).init();
    const msgBus = await (new MessageBus()).init(connectionSettings, log);

    //services
    const gate = await (new GateService()).init(msgBus, log);
    const henry = await(new HenryService()).init(msgBus, log);
    const ross = await(new RossService()).init(msgBus, log);
}


main();