import { readAll, ServerRequest } from "./deps.ts";

const dec = new TextDecoder();

const contentTypeJson = "application/json";

export const parseBody = async (request: ServerRequest): Promise<unknown> => {
  const buff = await readAll(request.body);
  const body = dec.decode(buff);
  return request.headers.get("content-type") === contentTypeJson ? JSON.parse(body) : body;
};
