import { getLogger, handlers, LevelName, Logger, setup } from "log/mod.ts";
import { LogRecord } from "log/logger.ts";

export type LogLevel = LevelName;

export const formatter = (message: LogRecord): string =>
  `[Overlord] ${message.levelName} ${message.datetime.toISOString()} ${message.msg}`;

export const createLogger = (level: LevelName): Logger => {
  setup({
    handlers: {
      overlord: new handlers.ConsoleHandler(level, {
        formatter,
      }),
    },
    loggers: {
      overlord: {
        level,
        handlers: ["overlord"],
      },
    },
  });
  return getLogger("overlord");
};
