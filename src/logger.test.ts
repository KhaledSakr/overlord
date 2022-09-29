import { Logger } from "log/mod.ts";
import { LogRecord } from "log/logger.ts";
import { assertEquals, assertStringIncludes } from "dev/testing/asserts.ts";
import { createLogger, formatter } from "./logger.ts";

Deno.test("[Logger] [formatter] should correctly format log records", () => {
  const message = formatter(
    new LogRecord({
      msg: "this a log",
      loggerName: "Logger",
      level: 10,
      args: [],
    }),
  );
  assertStringIncludes(message, "[Overlord]", "contains");
  assertStringIncludes(message, "DEBUG");
  assertStringIncludes(message, "this a log");
});

Deno.test("[Logger] should create and return logger", async () => {
  const logger = await createLogger("ERROR");
  assertEquals(logger instanceof Logger, true);
});
