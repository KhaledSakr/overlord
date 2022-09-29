/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { HttpPayload } from "../types.ts";
import { isResponse, Response } from "./response.ts";

const importAndRunModule = async (
  event: MessageEvent<{ data: HttpPayload; url: string }>,
) => {
  try {
    const mod = await import(event.data.url);
    const res = await mod.run(event.data.data);
    await self.postMessage({
      type: "response",
      payload: isResponse(res) ? res.toObject() : new Response(res).toObject(),
    });
  } catch (err) {
    await self.postMessage({
      type: "error",
      payload: err.message,
    });
  }
};

self.onmessage = (
  event: MessageEvent<{ data: HttpPayload; url: string }>,
) => {
  importAndRunModule(event);
};
