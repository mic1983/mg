class RossService {
    async init(msgBus, log) {
        this.msgBus = msgBus;
        this.logService = log;

        this.logService.log('Ross initialised');
        this.msgBus.subscribeQuery('ross-test', async (payload) => {
            this.logService.log('Ross answer to test query');
            return {
                message: 'Ross answer to test query'
            }
        });

        return this;
    }
}

module.exports = RossService;
