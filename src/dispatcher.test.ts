import { delay } from "dev/async/delay.ts";
import { assertEquals } from "dev/testing/asserts.ts";
import { Dispatcher, Mission } from "./dispatcher.ts";
import { getLogger } from "log/mod.ts";

const logger = getLogger("test");

const createMockMission = (): {
  mission: Mission;
  calledTimes: () => number;
  resolver: () => void;
} => {
  let calls = 0;
  let resolver: () => void;
  const promise = new Promise<void>((resolve) => {
    resolver = resolve;
  });
  const mission = () => {
    calls++;
    return promise;
  };
  const calledTimes = () => calls;
  return { mission, calledTimes, resolver: resolver! };
};

Deno.test("[Dispatcher] should properly queue missions", async () => {
  const dispatcher = new Dispatcher({ size: 1, logger });

  const {
    mission: firstMission,
    calledTimes: firstMissionCalledTimes,
    resolver: firstMissionResolver,
  } = createMockMission();

  const {
    mission: secondMission,
    calledTimes: secondMissionCalledTimes,
  } = createMockMission();

  dispatcher.addMission(firstMission, () => {});
  assertEquals(
    firstMissionCalledTimes(),
    1,
    "first mission should be called once",
  );

  dispatcher.addMission(secondMission, () => {});
  assertEquals(
    secondMissionCalledTimes(),
    0,
    "second mission should not be called yet",
  );

  firstMissionResolver();
  await delay(100);
  assertEquals(
    secondMissionCalledTimes(),
    1,
    "second mission should now be called once",
  );
});

Deno.test("[Dispatcher] should execute multiple missions in parallel if size allows", () => {
  const dispatcher = new Dispatcher({ size: 2, logger });
  const {
    mission: firstMission,
    calledTimes: firstMissionCalledTimes,
  } = createMockMission();

  const {
    mission: secondMission,
    calledTimes: secondMissionCalledTimes,
  } = createMockMission();

  dispatcher.addMission(firstMission, () => {});
  assertEquals(
    firstMissionCalledTimes(),
    1,
    "first mission should be called once",
  );

  dispatcher.addMission(secondMission, () => {});
  assertEquals(
    secondMissionCalledTimes(),
    1,
    "second mission should be called once",
  );
});

Deno.test("[Dispatcher] should log errors", async () => {
  let errorCalled = false;
  const testLogger = {
    ...logger,
    error: () => errorCalled = true,
  } as unknown as typeof logger;
  const dispatcher = new Dispatcher({ size: 1, logger: testLogger });
  let errorHandlerCalled = false;
  const mission = () => {
    return Promise.reject(new Error("an error"));
  };
  const errorHandler = () => {
    errorHandlerCalled = true;
  };
  await dispatcher.addMission(mission, errorHandler);
  assertEquals(errorCalled, true);
  assertEquals(errorHandlerCalled, true);
});
