export interface soResponse {
  type: number;
  code: number;
}

export function checkResponse(response: string): soResponse {
  return { type: parseInt(response[0]), code: parseInt(response[1]) };
}

export function getCallbackId(response: string): number {
  return parseInt(response.slice(2));
}

export function getArrayFromRequest(response: string): string[] {
  const match = /\[.+\]/;
  const parsedResponse = response.match(match);
  return parsedResponse ? JSON.parse(parsedResponse[0]) : [];
}
