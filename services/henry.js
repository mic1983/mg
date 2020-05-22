class HenryService {
    async init(msgBus, log) {
        this.msgBus = msgBus;
        this.logService = log;

        this.logService.log('Henry initialised');
        this.msgBus.subscribeQuery('henry-test', async (payload) => {
            this.logService.log('Henry answer to test query');
            return {
                message: 'Henry answer to test query'
            };
        });

        return this;
    }
}

module.exports = HenryService;
