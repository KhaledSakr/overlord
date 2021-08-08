import { Logger } from "./deps.ts";

export interface DispatcherInstructions {
  size: number;
  logger: Logger;
}

export type Mission = () => Promise<void>;
export type ErrorHandler = (err: Error) => void;

export class Dispatcher {
  #size: Readonly<number>;
  #queue: [Mission, ErrorHandler][] = [];
  #utilization = 0;
  #logger: Logger;

  constructor(instructions: DispatcherInstructions) {
    this.#size = instructions.size;
    this.#logger = instructions.logger;
  }

  addMission(mission: Mission, errorHandler: ErrorHandler): void {
    this.#queue.push([mission, errorHandler]);
    this.#processQueue();
  }

  #processQueue(): void {
    if (this.#utilization >= this.#size || this.#queue.length === 0) {
      return;
    }

    const [mission, errorHandler] = this.#queue.shift()!;
    this.#execute(mission, errorHandler);
  }

  async #execute(mission: Mission, errorHandler: ErrorHandler): Promise<void> {
    this.#utilization++;
    try {
      await mission();
    } catch (err) {
      this.#logger.error(`An error occurred while executing`, err);
      errorHandler(err);
    } finally {
      this.#utilization--;
      this.#processQueue();
    }
  }
}
