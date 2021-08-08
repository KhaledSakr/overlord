import { Logger, ServerRequest } from "./deps.ts";
import { parseBody } from "./utils.ts";
import { ResponsePayload } from "./response.ts";

export interface Payload<T = unknown> {
  body: T;
  headers: Record<string, string>;
  url: string;
  method: string;
}

export interface MinionInstructions {
  timeout: number;
  logger: Logger;
  workerPath?: string,
}

export interface WorkOrder {
  request: ServerRequest;
  url: string;
}

export class Minion {
  #timeout: Readonly<number>;
  #logger: Readonly<Logger>;
  #workerUrl: Readonly<string>;

  constructor(instructions: MinionInstructions) {
    this.#timeout = instructions.timeout;
    this.#logger = instructions.logger;
    this.#workerUrl = new URL(instructions.workerPath ?? "./worker.ts", import.meta.url).href;
  }

  async #handleTimout(request: ServerRequest): Promise<void> {
    this.#logger.warning("Worker timed out", request.url);
    await request.respond({
      status: 408,
    });
  }

  #payloadToHttpResponse(payload: ResponsePayload) {
    return {
      body: JSON.stringify(payload.body),
      status: payload.status,
      headers: new Headers(payload.headers),
      statusText: payload.statusText,
    }
  }

  async #handleMessage(
    request: ServerRequest,
    event: MessageEvent,
  ): Promise<void> {
    if (event.data.type === "error") {
      const error = event.data.payload as string
      if (error.includes('Cannot resolve module') || error.includes('404')) {
        this.#logger.error("Worker script could not be resolved: " + error);
        return this.#handleError(request, 404)
      } else {
        this.#logger.error("An error occurred in the worker:", event.data.payload);
        return this.#handleError(request);
      }
    }
    const response = event.data.payload as ResponsePayload;
    await request.respond(this.#payloadToHttpResponse(response));
  }

  async #handleError(request: ServerRequest, status = 500): Promise<void> {
    await request.respond({
      status,
    });
  }

  async #preparePayload(request: ServerRequest): Promise<Payload> {
    const body = await parseBody(request);
    return {
      body,
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
      method: request.method,
    };
  }

  #getMinionPermissions(url: string) {
    return {
      net: true,
      write: false,
      read: [
        new URL(url, import.meta.url).pathname,
        new URL("./response.ts", import.meta.url).pathname,
      ],
    };
  }

  async doWork({ url, request }: Readonly<WorkOrder>): Promise<void> {
    const worker = new Worker(this.#workerUrl, {
      type: "module",
      deno: {
        permissions: this.#getMinionPermissions(url),
      },
    });

    const payload = await this.#preparePayload(request);

    return await new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        worker.terminate();
        await this.#handleTimout(request);
        resolve();
      }, this.#timeout);

      worker.onmessage = async (event: MessageEvent) => {
        this.#logger.debug("Message received from worker");
        worker.terminate();
        clearTimeout(timeoutId);
        await this.#handleMessage(request, event);
        resolve();
      };

      worker.onerror = async (err) => {
        this.#logger.error("An error occurred in the worker:", err.message);
        err.preventDefault();
        worker.terminate();
        clearTimeout(timeoutId);
        await this.#handleError(request);
        resolve();
      };

      this.#logger.debug("Sending payload to worker");
      worker.postMessage({ data: payload, url });
    });
  }
}
