/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

self.onmessage = () => {
  throw new Error("Beep boop");
};
