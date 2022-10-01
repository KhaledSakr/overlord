import { assertEquals } from "dev/testing/asserts.ts";
import { getLogger } from "log/mod.ts";
import { Minion } from "./minion.ts";

const logger = getLogger("test");

class MockRequest extends Request {
  respond(_: Response) {
    return Promise.resolve();
  }
  json(): Promise<string> {
    return Promise.resolve("{}");
  }
}

const testMinion = (url: string, workerPath?: string) => {
  const minion = new Minion({
    logger,
    timeout: 5000,
    workerPath,
  });
  const request = new MockRequest("http://localhost:4000", {
    headers: new Headers({ "content-type": "application/json" }),
  });
  return minion.doWork({
    url,
    request,
  });
};

Deno.test("[Minion] should handle response codes", async () => {
  const response = await testMinion("../mocks/runnable_response.ts");
  assertEquals(response.status, 201);
});

Deno.test("[Minion] should handle text responses", async () => {
  const response = await testMinion("../mocks/runnable_text.ts");
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "<foo>bar</foo>");
});

Deno.test("[Minion] should handle errors in the worker", async () => {
  const response = await testMinion("../mocks/runnable_throws.ts");
  assertEquals(response.status, 500);
});

Deno.test("[Minion] should handle worker timeout", async () => {
  const response = await testMinion("../mocks/runnable_timeout.ts");
  assertEquals(response.status, 408);
});

Deno.test("[Minion] should handle non-existant urls", async () => {
  const response = await testMinion("../mocks/runnable_xyz.ts");
  assertEquals(response.status, 404);
});

Deno.test("[Minion] should handle worker errors", async () => {
  const response = await testMinion(
    "../mocks/runnable_xyz.ts",
    "../mocks/worker_faulty.ts",
  );
  assertEquals(response.status, 500);
});
