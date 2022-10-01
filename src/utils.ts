const contentTypeJson = "application/json";

export const parseBody = (request: Request): Promise<unknown> => {
  return request.headers.get("content-type") === contentTypeJson
    ? request.json()
    : request.text();
};
