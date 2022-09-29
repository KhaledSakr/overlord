import { getLogger, handlers, LevelName, Logger, LogRecord, setup } from "./deps.ts";

export type LogLevel = LevelName;

export const formatter = (message: LogRecord): string =>
  `[Overlord] ${message.levelName} ${message.datetime.toISOString()} ${message.msg}`;

export const createLogger = async (level: LevelName): Promise<Logger> => {
  await setup({
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
