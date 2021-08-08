import { HttpPayload } from "../types.ts";
import { isResponse } from "./response.ts";

declare global {
  interface Window {
    onmessage: (
      event: MessageEvent<{ data: HttpPayload; url: string }>,
    ) => void;
    postMessage: (message: unknown) => Promise<void>;
  }
}

const importAndRunModule = async (
  event: MessageEvent<{ data: HttpPayload; url: string }>,
) => {
  try {
    const mod = await import(event.data.url);
    const res = await mod.run(event.data.data);
    await self.postMessage({
      type: "response",
      payload: isResponse(res) ? res.toObject() : res,
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
