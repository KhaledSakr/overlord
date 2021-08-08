import { Response } from "./src/response.ts";
import { Payload } from "./src/minion.ts";

export type HttpPayload<T = unknown> = Payload<T>;

export type HttpResponse =
  | string
  | Record<string, string | number | Array<unknown>>
  | Array<unknown>
  | number
  | Response;
