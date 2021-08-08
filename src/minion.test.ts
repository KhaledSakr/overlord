import { assertEquals, StringReader } from "./deps_test.ts";
import { getLogger, Response, ServerRequest } from "./deps.ts";
import { Minion } from "./minion.ts";

const logger = getLogger("test");

class MockRequest extends ServerRequest {
  respond(_: Response) {
    return Promise.resolve();
  }
  get body(): Deno.Reader {
    return new StringReader("{}");
  }
}

const testMinion = async (url: string, workerPath?: string) => {
  const minion = new Minion({
    logger,
    timeout: 10000,
    workerPath,
  });
  const request = new MockRequest();
  request.headers = new Headers({ "content-type": "application/json" });
  let calledWithArgs: Response | null = null;
  request.respond = (args) => {
    calledWithArgs = args;
    return Promise.resolve();
  };
  await minion.doWork({
    url,
    request,
  });
  return calledWithArgs!;
};

Deno.test("[Minion] should handle response codes", async () => {
  const calledWithArgs = await testMinion("../mocks/runnable_response.ts");
  assertEquals(calledWithArgs.status, 201);
});

Deno.test("[Minion] should handle errors in the worker", async () => {
  const calledWithArgs = await testMinion("../mocks/runnable_throws.ts");
  assertEquals(calledWithArgs.status, 500);
});

Deno.test("[Minion] should handle worker timeout", async () => {
  const calledWithArgs = await testMinion("../mocks/runnable_timeout.ts");
  assertEquals(calledWithArgs.status, 408);
});

Deno.test("[Minion] should handle non-existant urls", async () => {
  const calledWithArgs = await testMinion("../mocks/runnable_xyz.ts");
  assertEquals(calledWithArgs.status, 404);
});

Deno.test("[Minion] should handle worker errors", async () => {
  const calledWithArgs = await testMinion(
    "../mocks/runnable_xyz.ts",
    "../mocks/worker_faulty.ts",
  );
  assertEquals(calledWithArgs.status, 500);
});
