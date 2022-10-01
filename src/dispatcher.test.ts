import { delay } from "dev/async/delay.ts";
import { assertEquals } from "dev/testing/asserts.ts";
import { Dispatcher, Mission } from "./dispatcher.ts";

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
  const dispatcher = new Dispatcher({ size: 1 });

  const {
    mission: firstMission,
    calledTimes: firstMissionCalledTimes,
    resolver: firstMissionResolver,
  } = createMockMission();

  const {
    mission: secondMission,
    calledTimes: secondMissionCalledTimes,
  } = createMockMission();

  dispatcher.addMission(firstMission);
  assertEquals(
    firstMissionCalledTimes(),
    1,
    "first mission should be called once",
  );

  dispatcher.addMission(secondMission);
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
  const dispatcher = new Dispatcher({ size: 2 });
  const {
    mission: firstMission,
    calledTimes: firstMissionCalledTimes,
  } = createMockMission();

  const {
    mission: secondMission,
    calledTimes: secondMissionCalledTimes,
  } = createMockMission();

  dispatcher.addMission(firstMission);
  assertEquals(
    firstMissionCalledTimes(),
    1,
    "first mission should be called once",
  );

  dispatcher.addMission(secondMission);
  assertEquals(
    secondMissionCalledTimes(),
    1,
    "second mission should be called once",
  );
});
