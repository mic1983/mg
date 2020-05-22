const MsgBus = require("./msgBus");
const QueryPackage = require("./msgUtils/QueryPackage")

//to get intellisense
var msgBus = new MsgBus();

beforeEach(() => {
    msgBus = new MsgBus();
})

it("should be defined", () => {
    expect(msgBus).toBeDefined();
});

it("should initialize", async () => {
    await expect(msgBus.init()).resolves.toEqual(true);
});

it("should subscribe local broadcast", async () => {
    let callback = data => { };

    await msgBus.subscribeBroadcast(callback);
    expect(msgBus._localBroadcastSubs).toContainEqual(callback);
});

it("should subscribe local broadcasts", async () => {
    let callbacks = [];

    for (let index = 0; index < 4; index++) {
        let callback = data => index;
        callbacks.push(callback);
    }

    callbacks.forEach(async callback => {
        await msgBus.subscribeBroadcast(callback);
    });

    expect(msgBus._localBroadcastSubs).toEqual(callbacks);
});

it("should subscribe local query", async () => {
    let subject = "test";
    let callback = () => { };
    let callbacks = [callback]

    await msgBus.subscribeQuery(subject, callback);
    expect(msgBus._localQuerySubs).toHaveProperty(subject, callbacks);
});

it("should subscribe local queries", async () => {
    let subject = "test";

    let callbacks = [];
    for (let index = 0; index < 4; index++) {
        let callback = data => index;
        callbacks.push(callback);
    }

    callbacks.forEach(async callback => {
        await msgBus.subscribeQuery(subject, callback);
    });

    expect(msgBus._localQuerySubs).toHaveProperty(subject, callbacks);
});

it("should create queryPackage", async () => {
    let subject = "test";
    let payload = {};
    let resolve = () => { };

    let id = "some guid";
    let getId = jest.fn(() => id);
    msgBus._generateGuid = getId;

    let queryPackage = await msgBus.createQueryPackage(subject, payload, resolve);

    expect(queryPackage).toHaveProperty("query", subject);
    expect(queryPackage).toHaveProperty("payload", payload);
    expect(queryPackage).toHaveProperty("query-id", id);
    expect(queryPackage).toHaveProperty("node", msgBus._hostname);
    expect(queryPackage).toHaveProperty("result", undefined);
});

it("should mark query as pending", async () => {
    let subject = "test";
    let payload = {};
    let resolve = () => { };

    let id = "some guid";
    let getId = jest.fn(() => id);
    msgBus._generateGuid = getId;

    await msgBus.createQueryPackage(subject, payload, resolve);

    expect(msgBus._pendingLocalQuerys.get(id)).toBe(resolve);
});

it("should finish pending query", async () => {
    let subject = "test";
    let payload = {};
    let id = "some guid";
    let result = "result";
    let resultPackage = new QueryPackage(subject, payload, id, msgBus._hostname);
    resultPackage.result = result;

    let resolve = jest.fn(() => { });
    msgBus._pendingLocalQuerys.set(id, resolve);

    await msgBus.finishQuery(resultPackage);

    expect(msgBus._pendingLocalQuerys.get(id)).not.toBeDefined();
    expect(resolve).toBeCalledTimes(1);
});

it("should not finish already finished query", async () => {
    let subject = "test";
    let payload = {};
    let id = "some guid";
    let result = "result";
    let resultPackage = new QueryPackage(subject, payload, id, msgBus._hostname);
    resultPackage.result = result;

    let resolve = jest.fn(() => { });
    msgBus._pendingLocalQuerys.set(id, resolve);

    await msgBus.finishQuery(resultPackage);
    await msgBus.finishQuery(resultPackage);

    expect(msgBus._pendingLocalQuerys.get(id)).not.toBeDefined();
    expect(resolve).toBeCalledTimes(1);
});

it("should start notifying local broadcast subs", async () => {
    let payload = {};

    let notifyLocalBroadcastSubs = jest.fn((data) => { });
    msgBus.notifyLocalBroadcastSubscribers = notifyLocalBroadcastSubs;

    let notifyLocalQuerySubs = jest.fn((data) => { });
    msgBus.notifyLocalQuerySubscribers = notifyLocalQuerySubs;

    msgBus.notifyLocalSubscribers(payload);

    expect(notifyLocalBroadcastSubs).toBeCalledTimes(1);
    expect(notifyLocalQuerySubs).toBeCalledTimes(0);
});

it("should start notifying local query subs", async () => {
    let subject = "test";
    let payload = {};
    let id = "some guid";
    let result = "result";
    let resultPackage = new QueryPackage(subject, payload, id, msgBus._hostname);
    resultPackage.result = result;

    let notifyLocalBroadcastSubs = jest.fn((data) => { });
    msgBus.notifyLocalBroadcastSubscribers = notifyLocalBroadcastSubs;

    let notifyLocalQuerySubs = jest.fn((data) => { });
    msgBus.notifyLocalQuerySubscribers = notifyLocalQuerySubs;

    await msgBus.notifyLocalSubscribers(resultPackage);

    expect(notifyLocalBroadcastSubs).toBeCalledTimes(0);
    expect(notifyLocalQuerySubs).toBeCalledTimes(1);
});

it("should notify all local broadcast subs", async () => {
    let payload = {};

    let mockSub1 = jest.fn((data) => { });
    let mockSub2 = jest.fn((data) => { });
    let mockSub3 = jest.fn((data) => { });

    msgBus._localBroadcastSubs.push(mockSub1);
    msgBus._localBroadcastSubs.push(mockSub2);
    msgBus._localBroadcastSubs.push(mockSub3);

    await msgBus.notifyLocalBroadcastSubscribers(payload);

    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);
    expect(mockSub3).toBeCalledTimes(1);
});

it("should notify all local query subs", async () => {
    let mockPublish = jest.fn((node, message) => { });
    let mockPublisher = new Object();
    mockPublisher.publish = mockPublish;
    msgBus._publisher = mockPublisher;

    let subject = "test";
    let payload = {};
    let id = "some guid";
    let queryPackage = new QueryPackage(subject, payload, id, msgBus._hostname);

    let mockSub1 = jest.fn((data) => { });
    let mockSub2 = jest.fn((data) => { });
    let mockSub3 = jest.fn((data) => { });

    msgBus._localQuerySubs[subject] = []
    msgBus._localQuerySubs[subject].push(mockSub1);
    msgBus._localQuerySubs[subject].push(mockSub2);
    msgBus._localQuerySubs[subject].push(mockSub3);

    await msgBus.notifyLocalQuerySubscribers(queryPackage);

    expect(mockPublish).toBeCalledTimes(3);

    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);
    expect(mockSub3).toBeCalledTimes(1);
});

it("should notify wildcard local query subs", async () => {
    let mockPublish = jest.fn((channel, message) => { });
    let mockPublisher = new Object();
    mockPublisher.publish = mockPublish;
    msgBus._publisher = mockPublisher;

    let wildcard = "*";
    let subject = "test";
    let payload = {};
    let id = "some guid";
    let queryPackage = new QueryPackage(subject, payload, id, msgBus._hostname);

    let mockSub1 = jest.fn((data) => { });
    let mockSub2 = jest.fn((data) => { });
    let mockSub3 = jest.fn((data) => { });
    let mockWildcardSub = jest.fn((data) => { });

    msgBus._localQuerySubs[subject] = []
    msgBus._localQuerySubs[subject].push(mockSub1);
    msgBus._localQuerySubs[subject].push(mockSub2);
    msgBus._localQuerySubs[subject].push(mockSub3);

    msgBus._localQuerySubs[wildcard] = [];
    msgBus._localQuerySubs[subject].push(mockWildcardSub);


    await msgBus.notifyLocalQuerySubscribers(queryPackage);

    expect(mockPublish).toBeCalledTimes(4);

    expect(mockSub1).toBeCalledTimes(1);
    expect(mockSub2).toBeCalledTimes(1);
    expect(mockSub3).toBeCalledTimes(1);
    expect(mockWildcardSub).toBeCalledTimes(1);
});

it("should publish broadcast", async () => {
    let mockPublish = jest.fn((channel, message) => { });
    let mockPublisher = new Object();
    mockPublisher.publish = mockPublish;
    msgBus._publisher = mockPublisher;

    let payload = {};

    await msgBus.broadcast(payload);

    expect(mockPublish).toBeCalledWith("broadcast", JSON.stringify(payload));
});

it("should publish query", async () => {
    let mockPublish = jest.fn((channel, message) => { });
    let mockPublisher = new Object();
    mockPublisher.publish = mockPublish;
    msgBus._publisher = mockPublisher;

    let subject = "test";
    let payload = {};
    let id = "some guid";
    let queryPackage = new QueryPackage(subject, payload, id, msgBus._hostname);

    let mockCreateQueryPackage = jest.fn(async (subject, payload, resolve) => {
        resolve();
        return queryPackage;
    });
    msgBus.createQueryPackage = mockCreateQueryPackage;

    await msgBus.query(subject, payload);

    expect(mockCreateQueryPackage).toBeCalledTimes(1);
    expect(mockPublish).toBeCalledWith("broadcast", JSON.stringify(queryPackage));
});

it("should send broadcast", async () => {
    await msgBus.init();

    let payload = {};
    let mockFn = jest.fn(() => {
        //This is done like this because the promise returned
        //from broadcast() resolves when the broadcast is sent.
        //No when subscribed funcs are executed.
        expect(mockFn).toBeCalledTimes(1);
    });

    await msgBus.subscribeBroadcast(mockFn);

    await msgBus.broadcast(payload);
});

it("should send query", async () => {
    await msgBus.init();

    let payload = {};
    let subject = "test";
    let expResult = "result"
    let mockFn = jest.fn(() => expResult);

    await msgBus.subscribeQuery(subject, mockFn);

    let result = await msgBus.query(subject, payload);

    expect(result).toBe(expResult);
    expect(mockFn).toBeCalledTimes(1);
});
