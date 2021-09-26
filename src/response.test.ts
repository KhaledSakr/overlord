import { isResponse, Response } from "./response.ts";
import { assertEquals } from "./deps_test.ts";

Deno.test("[Response] [isResponse] should return true if object is an instance of response", () => {
  const res = new Response({});
  assertEquals(isResponse(res), true);
});

Deno.test("[Response] [isResponse] should return false if object is not an instance of response", () => {
  const res = {
    body: {},
    status: 200,
  };
  assertEquals(isResponse(res), false);
});

Deno.test("[Response] should set correct content type for text", () => {
  const res = new Response("<span>Hello world!</>");
  assertEquals(res.headers["content-type"], "text/html");
});

Deno.test("[Response] should set correct content type for json", () => {
  const res = new Response({});
  assertEquals(res.headers["content-type"], "application/json");
});

Deno.test("[Response] should default to status 200", () => {
  const res = new Response({});
  assertEquals(res.status, 200);
});

Deno.test("[Response] should understand custom statuses", () => {
  const res = new Response({}, { status: 204 });
  assertEquals(res.status, 204);
});

Deno.test("[Response] should be convertable to plain object", () => {
  const res = new Response("<foo><bar>Hello</bar></foo>", {
    headers: { authorization: "Bearer 123" },
  });
  const obj = res.toObject();
  assertEquals(obj.body, "<foo><bar>Hello</bar></foo>");
  assertEquals(
    Object.values(obj).every((val) => typeof val !== "function"),
    true,
  );
});
