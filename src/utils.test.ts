import { assertEquals } from "dev/testing/asserts.ts";
import { parseBody } from "./utils.ts";

Deno.test("[utils] [parseBody] should handle JSON bodies", async () => {
  const request = new Request("http://localhost:8080", {
    headers: new Headers({
      "content-type": "application/json",
      "authorization": "Bearer 123",
    }),
    body: "{}",
    method: 'POST',
  });
  const body = await parseBody(request);
  assertEquals(body, {});
});
Deno.test("[utils] [parseBody] should handle string bodies", async () => {
  const request = new Request("http://localhost:8080", {
    headers: new Headers({
      "content-type": "application/text",
      "authorization": "Bearer 123",
    }),
    body: "{}",
    method: 'POST',
  });
  const body = await parseBody(request);
  assertEquals(body, "{}");
});
