import { assertEquals } from "dev/testing/asserts.ts";
import { getLogger } from "log/mod.ts";
import { Overlord } from "./overlord.ts";
import { Minion, WorkOrder } from "./minion.ts";

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
    minion.doWork = (order) => {
      takeOrderCalledWithArgs.push(order);
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    return minion;
  };
  overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST" });
  await result.body?.cancel();
  assertEquals(takeOrderCalledWithArgs.length, 1);
  assertEquals(takeOrderCalledWithArgs[0].url, "./mocks/hello.ts");
  await overlord.stop();
});

Deno.test("[Overlord] [rootPath] should send orders to minions with correct url when modifying appendFileExtension", async () => {
  const overlord = new Overlord({
    port: 4000,
    rootPath: "./mocks",
    logLevel: "CRITICAL",
    appendFileExtension: "",
  });
  const takeOrderCalledWithArgs: WorkOrder[] = [];
  overlord.createMinion = (opts) => {
    const minion = new Minion(opts);
    minion.doWork = (order) => {
      takeOrderCalledWithArgs.push(order);
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    return minion;
  };
  overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST" });
  await result.body?.cancel();
  assertEquals(takeOrderCalledWithArgs.length, 1);
  assertEquals(takeOrderCalledWithArgs[0].url, "./mocks/hello");
  await overlord.stop();
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
    minion.doWork = (order) => {
      takeOrderCalledWithArgs.push(order);
      return Promise.resolve(new Response(null, { status: 200 }));
    };
    return minion;
  };
  overlord.start();
  const result = await fetch("http://localhost:4000/hello", { method: "POST" });
  await result.body?.cancel();
  assertEquals(takeOrderCalledWithArgs.length, 1);
  assertEquals(takeOrderCalledWithArgs[0].url, "http://localhost:5000/world");
  await overlord.stop();
});

Deno.test("[Overlord] should handle execution errors", async () => {
  const overlord = new Overlord({
    port: 4000,
    urlMap: {
      "/hello": "http://localhost:5000/world",
    },
    logLevel: "CRITICAL",
  });
  overlord.createMinion = () => {
    return {
      doWork: () =>
        new Promise((_, reject) => {
          reject(new Error("an error"));
        }),
    } as unknown as Minion;
  };
  overlord.start();
  const result = await fetch("http://localhost:4000/hello", {
    method: "POST",
  });
  assertEquals(result.status, 500);
  await result.body?.cancel();
  await overlord.stop();
});
