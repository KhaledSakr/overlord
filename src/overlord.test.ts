import { assertEquals } from "./deps_test.ts";
import { Overlord } from "./overlord.ts";
import { Minion, WorkOrder } from "./minion.ts";
import { getLogger } from "./deps.ts";

Deno.test("[Overlord] should create minions", () => {
  const overlord = new Overlord({
    port: 4000,
    rootPath: "./mocks",
    logLevel: "CRITICAL",
  });
  const minion = overlord.createMinion({
    timeout: 1,
    logger: getLogger("test"),
  });
  assertEquals(minion instanceof Minion, true);
});

Deno.test("[Overlord] [rootPath] should send orders to minions with correct url", async () => {
  const overlord = new Overlord({
    port: 4000,
    rootPath: "./mocks",
    logLevel: "CRITICAL",
  });
  const takeOrderCalledWithArgs: WorkOrder[] = [];
  overlord.createMinion = (opts) => {
    const minion = new Minion(opts);
    minion.doWork = async (order) => {
      takeOrderCalledWithArgs.push(order);
      await order.request.respond({ status: 200 });
    };
    return minion;
  };
  await overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST" });
  await result.body?.cancel();
  assertEquals(takeOrderCalledWithArgs.length, 1);
  assertEquals(takeOrderCalledWithArgs[0].url, "./mocks/hello");
  overlord.stop();
});

Deno.test("[Overlord] [urlMap] should send orders to minions with correct url", async () => {
  const overlord = new Overlord({
    port: 4000,
    urlMap: {
      "/hello": "http://localhost:5000/world",
    },
    logLevel: "CRITICAL",
  });
  const takeOrderCalledWithArgs: WorkOrder[] = [];
  overlord.createMinion = (opts) => {
    const minion = new Minion(opts);
    minion.doWork = async (order) => {
      takeOrderCalledWithArgs.push(order);
      await order.request.respond({ status: 200 });
    };
    return minion;
  };
  await overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST" });
  await result.body?.cancel();
  assertEquals(takeOrderCalledWithArgs.length, 1);
  assertEquals(takeOrderCalledWithArgs[0].url, "http://localhost:5000/world");
  overlord.stop();
});

Deno.test("[Overlord] should handle errors reported by dispatcher", async () => {
  const overlord = new Overlord({
    port: 4000,
    urlMap: {
      "/hello": "http://localhost:5000/world",
    },
    logLevel: "CRITICAL",
  });
  const controller = new AbortController();
  overlord.createMinion = () => {
    throw new Error("an error");
  };
  await overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST", signal: controller.signal });
  assertEquals(result.status, 500);
  await result.body?.cancel();
  overlord.stop();
});
