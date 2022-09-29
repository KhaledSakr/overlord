export const responseType = Symbol("response");

export interface ResponsePayload {
  body: unknown;
  status: number;
  headers: Record<string, string>;
  statusText?: string;
}

export class Response implements ResponsePayload {
  body: unknown;
  status: number;
  headers: Record<string, string>;
  statusText?: string;

  type = responseType;

  constructor(
    body: unknown,
    options?: Partial<Omit<Response, "body">>,
  ) {
    this.body = body;
    this.status = options?.status ?? 200;
    this.statusText = options?.statusText;
    this.headers = {
      "content-type": typeof body === "string" ? "text/html" : "application/json",
      ...options?.headers,
    };
  }

  toObject(): ResponsePayload {
    return {
      body: this.body,
      status: this.status,
      headers: this.headers,
      statusText: this.statusText,
    };
  }
}

export const isResponse = (
  obj: string | number | Array<unknown> | Record<string, unknown> | Response,
): obj is Response => {
  return typeof obj === "object" && "type" in obj &&
    obj.type === responseType;
};
