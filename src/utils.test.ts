import { assertEquals } from "dev/testing/asserts.ts";
import { StringReader } from "io/readers.ts";
import { Response, ServerRequest } from "http/server.ts";
import { parseBody } from "./utils.ts";

class MockRequest extends ServerRequest {
  respond(_: Response) {
    return Promise.resolve();
  }

  get body(): Deno.Reader {
    return new StringReader("{}");
  }
}

Deno.test("[utils] [parseBody] should handle JSON bodies", async () => {
  const request = new MockRequest();
  request.headers = new Headers({
    "content-type": "application/json",
    "authorization": "Bearer 123",
  });
  const body = await parseBody(request);
  assertEquals(body, {});
});
Deno.test("[utils] [parseBody] should handle string bodies", async () => {
  const request = new MockRequest();
  request.headers = new Headers({
    "content-type": "application/text",
    "authorization": "Bearer 123",
  });
  const body = await parseBody(request);
  assertEquals(body, "{}");
});
