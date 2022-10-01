/// <reference lib="deno.unstable" />

import { Logger } from "log/mod.ts";
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
  workerPath?: string;
}

export interface WorkOrder {
  request: Request;
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

  #handleTimeout(request: Request): Response {
    this.#logger.warning("Worker timed out", request.url);
    return new Response(null, {
      status: 408,
    });
  }

  #payloadToHttpResponse(payload: ResponsePayload): Response {
    const body = typeof payload.body === "string" ? payload.body : JSON.stringify(payload.body);
    return new Response(body, {
      status: payload.status,
      headers: new Headers(payload.headers),
      statusText: payload.statusText,
    });
  }

  #handleMessage(
    event: MessageEvent,
  ): Response | Promise<Response> {
    if (event.data.type === "error") {
      const error = event.data.payload as string;
      if (error.includes("Module not found") || error.includes("404")) {
        this.#logger.error("Worker script could not be resolved: " + error);
        return this.#handleError(404);
      } else {
        this.#logger.error(
          "An error occurred in the worker:",
          event.data.payload,
        );
        return this.#handleError();
      }
    }
    const response = event.data.payload as ResponsePayload;
    return this.#payloadToHttpResponse(response);
  }

  #handleError(status = 500): Response {
    return new Response(null, {
      status,
    });
  }

  async #preparePayload(request: Request): Promise<Payload> {
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

  async doWork({ url, request }: Readonly<WorkOrder>): Promise<Response> {
    const worker = new Worker(this.#workerUrl, {
      type: "module",
      deno: {
        permissions: this.#getMinionPermissions(url),
      },
    });

    const payload = await this.#preparePayload(request);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        worker.terminate();
        resolve(this.#handleTimeout(request));
      }, this.#timeout);

      worker.onmessage = async (event: MessageEvent) => {
        this.#logger.debug("Message received from worker");
        worker.terminate();
        clearTimeout(timeoutId);
        resolve(await this.#handleMessage(event));
      };

      worker.onerror = async (err) => {
        this.#logger.error("An error occurred in the worker:", err.message);
        err.preventDefault();
        err.stopPropagation();
        worker.terminate();
        clearTimeout(timeoutId);
        resolve(await this.#handleError());
      };

      this.#logger.debug("Sending payload to worker");
      worker.postMessage({ data: payload, url });
    });
  }
}
