import { Response } from "../src/response.ts";

export const run = () => {
  return new Response({ foo: "bar" }, { status: 201 });
};
