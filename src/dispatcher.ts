export interface DispatcherInstructions {
  size: number;
}

export type Mission = () => Promise<void>;
export type ErrorHandler = (err: Error) => void;

export class Dispatcher {
  #size: Readonly<number>;
  #queue: Mission[] = [];
  #utilization = 0;

  constructor(instructions: DispatcherInstructions) {
    this.#size = instructions.size;
  }

  addMission(mission: Mission): void {
    this.#queue.push(mission);
    this.#processQueue();
  }

  #processQueue(): void {
    if (this.#utilization >= this.#size || this.#queue.length === 0) {
      return;
    }

    const mission = this.#queue.shift()!;
    this.#execute(mission);
  }

  async #execute(mission: Mission): Promise<void> {
    this.#utilization++;
    await mission();
    this.#utilization--;
    this.#processQueue();
  }
}
