import { createLogger, LogLevel } from "./logger.ts";
import { Logger } from "log/mod.ts";
import { Server } from "http/server.ts";
import { Dispatcher } from "./dispatcher.ts";
import { Minion, MinionInstructions } from "./minion.ts";

export interface BaseOverlordOptions {
  /**
   * The port to run the server on.
   * @default 8080
   */
  port?: number;
  /**
   * Maximum time allowed for a single minion to handle a request. In milliseconds.
   * @default 10000
   */
  timeout?: number;
  /**
   * Sets the minimum log level for the overlord logger.
   * @default INFO
   */
  logLevel?: LogLevel;
  /**
   * An optional logger to override the default logger used by Overlord.
   */
  logger?: Logger;
  /**
   * The maximum number of minions to be spawned in parallel. Each received request spawns a new minion,
   * if the number of requests exceeds minionPoolSize, some of the requests will have to wait for a spot.
   * This number is basically a trade-off between number of threads on one hand, and response latency on
   * the other hand.
   * @default Infinity
   */
  minionPoolSize?: number;
}

export interface OverlordRootPathOptions extends BaseOverlordOptions {
  /**
   * The path of the root directory in which overlord can find the runnable scripts. This can be a url or
   * a path in the local file system.
   */
  rootPath: string;
  /**
   * A file extension to append to request URLS. This allows you to request localhost:8080/hello_world
   * instead of localhost:8080/hello_world.ts. If you use .js files, make sure to change this to `.js`.
   * To avoid appending any value at all, use an empty string.
   * For more advanced use cases, use `urlMap` instead.
   * @default .ts
   */
  appendFileExtension?: string;
}

export interface OverlordURLMapOptions extends BaseOverlordOptions {
  /**
   * A map of request paths to URLs. For each request that Overlord receives in a specific path, it will use
   * this map to resolve a URL to load the script from.
   */
  urlMap: Record<string, string>;
}

export type OverlordOptions = OverlordRootPathOptions | OverlordURLMapOptions;

function isRootPathType(
  opts: OverlordOptions,
): opts is OverlordRootPathOptions {
  return "rootPath" in opts;
}

export class Overlord {
  #opts: OverlordOptions;
  #server?: Server;
  #serverStartPromise?: Promise<void>;

  constructor(opts: OverlordOptions) {
    this.#opts = opts;
  }

  createMinion = (instructions: MinionInstructions) => new Minion(instructions);

  async start(): Promise<void> {
    const {
      port = 8080,
      logLevel = "INFO",
      minionPoolSize = Infinity,
      logger: customLogger,
    } = this.#opts;

    const logger = customLogger ?? createLogger(logLevel);

    const opts = this.#opts;
    const resolveUrl = isRootPathType(opts)
      ? (url: string) => opts.rootPath + url + (opts.appendFileExtension ?? ".ts")
      : (url: string) => opts.urlMap[url];

    const dispatcher = new Dispatcher({
      size: minionPoolSize,
    });

    const handler = (request: Request): Promise<Response> => {
      const requestUrl = new URL(request.url);
      const url = resolveUrl(requestUrl.pathname);

      logger.info(`Received a request for URL: ${url}`);

      return new Promise<Response>((resolve) => {
        const mission = async () => {
          const minion = this.createMinion({
            logger,
            timeout: this.#opts.timeout ?? 10000,
          });
          try {
            const res = await minion.doWork({ request, url });
            resolve(res);
          } catch (err) {
            logger.error(`An error occurred while executing`, err);
            resolve(
              new Response(null, {
                status: 500,
                statusText: "Ouch! That went unhandled.",
              }),
            );
          }
        };

        dispatcher.addMission(mission);
      });
    };

    this.#server = new Server({ port, handler });

    logger.info(`Started Overlord server at port ${port}`);

    this.#serverStartPromise = this.#server.listenAndServe();
    await this.#serverStartPromise;
  }

  async stop(): Promise<void> {
    this.#server?.close();
    await this.#serverStartPromise;
  }
}
