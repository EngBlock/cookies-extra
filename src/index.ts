import {
  parseCookieHeader,
  parseSetCookieHeaders,
  createCookieMapFromHeaders,
  createCookieMapFromSetCookieHeaders,
} from "./parsers";
import { Cookie } from "./cookie";

export {
  Cookie,
  CookieSameSite,
  type CookieOptions,
  type CookieStoreDeleteOptions,
} from "./cookie";
export {
  CookieMap,
  type KeyValuePair,
  type CookieMapInput,
} from "./cookie-map.ts";
export {
  parseCookieHeader,
  parseSetCookieHeaders,
  parseSetCookieHeader,
  cookiesToRecord,
  recordToCookies,
  createCookieMapFromHeaders,
  createCookieMapFromSetCookieHeaders,
  serializeCookieMap,
  writeSetCookieHeaders,
} from "./parsers.ts";

export function parseCookies(input: string | Headers): Record<string, string> {
  if (typeof input === "string") {
    return parseCookieHeader(input);
  } else {
    const cookieMap = createCookieMapFromHeaders(input);
    return cookieMap.toJSON();
  }
}

export function parseSetCookies(input: string[] | Headers): Cookie[] {
  if (Array.isArray(input)) {
    return parseSetCookieHeaders(input);
  } else {
    const cookieMap = createCookieMapFromSetCookieHeaders(input);
    return cookieMap.getAllChanges();
  }
}
