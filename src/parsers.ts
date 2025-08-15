import { Cookie } from "./cookie";
import { CookieMap } from "./cookie-map";

export function parseCookieHeader(
  cookieHeader: string,
): Record<string, string> {
  const cookieMap = new CookieMap(cookieHeader);
  return cookieMap.toJSON();
}

export function parseSetCookieHeaders(setCookieHeaders: string[]): Cookie[] {
  const cookies: Cookie[] = [];

  for (const header of setCookieHeaders) {
    try {
      const cookie = Cookie.parse(header);
      cookies.push(cookie);
    } catch (error) {
      console.warn("Failed to parse Set-Cookie header:", header, error);
    }
  }

  return cookies;
}

export function parseSetCookieHeader(setCookieHeader: string): Cookie {
  return Cookie.parse(setCookieHeader);
}

export function cookiesToRecord(cookies: Cookie[]): Record<string, string> {
  const record: Record<string, string> = {};

  for (const cookie of cookies) {
    record[cookie.name] = cookie.value;
  }

  return record;
}

export function recordToCookies(record: Record<string, string>): Cookie[] {
  const cookies: Cookie[] = [];

  for (const [name, value] of Object.entries(record)) {
    cookies.push(Cookie.create({ name, value }));
  }

  return cookies;
}

export function createCookieMapFromHeaders(headers: Headers): CookieMap {
  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    return new CookieMap(cookieHeader);
  }
  return new CookieMap();
}

export function createCookieMapFromSetCookieHeaders(
  headers: Headers,
): CookieMap {
  const setCookieHeaders = headers.getSetCookie?.() || [];
  const cookieMap = new CookieMap();

  for (const header of setCookieHeaders) {
    try {
      const cookie = Cookie.parse(header);
      cookieMap.set(cookie);
    } catch (error) {
      console.warn("Failed to parse Set-Cookie header:", header, error);
    }
  }

  return cookieMap;
}

export function serializeCookieMap(cookieMap: CookieMap): string {
  const pairs: string[] = [];

  for (const [name, value] of cookieMap.entries()) {
    pairs.push(`${name}=${encodeURIComponent(value)}`);
  }

  return pairs.join("; ");
}

export function writeSetCookieHeaders(
  cookieMap: CookieMap,
  headers: Headers,
): void {
  const changes = cookieMap.getAllChanges();

  for (const cookie of changes) {
    headers.append("Set-Cookie", cookie.toString());
  }
}
