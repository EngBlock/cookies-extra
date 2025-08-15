import {
  Cookie,
  type CookieStoreDeleteOptions,
  CookieSameSite,
} from "./cookie";

export interface KeyValuePair {
  key: string;
  value: string;
}

export type CookieMapInput =
  | string
  | Record<string, string>
  | Array<[string, string]>;

export class CookieMap {
  private originalCookies: KeyValuePair[] = [];
  private modifiedCookies: Cookie[] = [];

  constructor(input?: CookieMapInput) {
    if (input !== undefined) {
      this.initialize(input);
    }
  }

  private initialize(input: CookieMapInput): void {
    if (typeof input === "string") {
      this.parseFromCookieString(input);
    } else if (Array.isArray(input)) {
      this.parseFromArray(input);
    } else {
      this.parseFromRecord(input);
    }
  }

  private parseFromCookieString(cookieString: string): void {
    if (!cookieString.trim()) {
      return;
    }

    const pairs = cookieString.split(";");
    const hasPercentEncoded = cookieString.includes("%");

    for (const pair of pairs) {
      const equalsPos = pair.indexOf("=");
      if (equalsPos === -1) {
        continue;
      }

      const nameView = pair.substring(0, equalsPos).trim();
      const valueView = pair.substring(equalsPos + 1).trim();

      if (!nameView) {
        continue;
      }

      let name: string;
      let value: string;

      if (hasPercentEncoded) {
        try {
          name = decodeURIComponent(nameView);
          value = decodeURIComponent(valueView);
        } catch {
          name = nameView;
          value = valueView;
        }
      } else {
        name = nameView;
        value = valueView;
      }

      this.originalCookies.push({ key: name, value });
    }
  }

  private parseFromArray(pairs: Array<[string, string]>): void {
    for (const pair of pairs) {
      if (pair.length === 2) {
        this.originalCookies.push({ key: pair[0], value: pair[1] });
      }
    }
  }

  private parseFromRecord(record: Record<string, string>): void {
    for (const [key, value] of Object.entries(record)) {
      this.originalCookies.push({ key, value });
    }
  }

  static create(
    input: CookieMapInput,
    throwOnInvalidCookieString: boolean = false,
  ): CookieMap {
    try {
      return new CookieMap(input);
    } catch (error) {
      if (throwOnInvalidCookieString) {
        throw error;
      }
      return new CookieMap();
    }
  }

  get(name: string): string | undefined {
    const modifiedCookieIndex = this.modifiedCookies.findIndex(
      (cookie) => cookie.name === name,
    );
    if (modifiedCookieIndex !== -1) {
      const cookie = this.modifiedCookies[modifiedCookieIndex];
      if (!cookie.value) {
        return undefined;
      }
      return cookie.value;
    }

    const originalCookieIndex = this.originalCookies.findIndex(
      (cookie) => cookie.key === name,
    );
    if (originalCookieIndex !== -1) {
      return this.originalCookies[originalCookieIndex].value;
    }

    return undefined;
  }

  getAll(): KeyValuePair[] {
    const all: KeyValuePair[] = [];

    for (const cookie of this.modifiedCookies) {
      if (cookie.value) {
        all.push({ key: cookie.name, value: cookie.value });
      }
    }

    for (const cookie of this.originalCookies) {
      all.push({ key: cookie.key, value: cookie.value });
    }

    return all;
  }

  has(name: string): boolean {
    return this.get(name) !== undefined;
  }

  private removeInternal(name: string): void {
    this.originalCookies = this.originalCookies.filter(
      (cookie) => cookie.key !== name,
    );
    this.modifiedCookies = this.modifiedCookies.filter(
      (cookie) => cookie.name !== name,
    );
  }

  set(cookie: Cookie): void;
  set(name: string, value: string): void;
  set(nameOrCookie: string | Cookie, value?: string): void {
    if (typeof nameOrCookie === "string") {
      if (value === undefined) {
        throw new Error("Value is required when setting cookie by name");
      }
      const cookie = Cookie.create({
        name: nameOrCookie,
        value: value,
      });
      this.removeInternal(cookie.name);
      this.modifiedCookies.push(cookie);
    } else {
      this.removeInternal(nameOrCookie.name);
      this.modifiedCookies.push(nameOrCookie);
    }
  }

  delete(name: string): boolean;
  delete(options: CookieStoreDeleteOptions): boolean;
  delete(nameOrOptions: string | CookieStoreDeleteOptions): boolean {
    const name =
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name;
    const domain =
      typeof nameOrOptions === "object" ? nameOrOptions.domain : undefined;
    const path =
      typeof nameOrOptions === "object" ? nameOrOptions.path : undefined;

    const hadCookie = this.has(name);
    this.removeInternal(name);

    const deleteCookie = Cookie.create({
      name,
      value: "",
      domain: domain || "",
      path: path || "/",
      expires: 1,
      secure: false,
      sameSite: CookieSameSite.Lax,
      httpOnly: false,
      maxAge: NaN,
      partitioned: false,
    });

    this.modifiedCookies.push(deleteCookie);
    return hadCookie;
  }

  clone(): CookieMap {
    const clone = new CookieMap();
    clone.originalCookies = [...this.originalCookies];
    clone.modifiedCookies = [...this.modifiedCookies];
    return clone;
  }

  size(): number {
    let size = 0;
    for (const cookie of this.modifiedCookies) {
      if (cookie.value) {
        size += 1;
      }
    }
    size += this.originalCookies.length;
    return size;
  }

  toJSON(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const cookie of this.modifiedCookies) {
      if (cookie.value) {
        result[cookie.name] = cookie.value;
      }
    }

    for (const cookie of this.originalCookies) {
      if (!(cookie.key in result)) {
        result[cookie.key] = cookie.value;
      }
    }

    return result;
  }

  getAllChanges(): Cookie[] {
    return [...this.modifiedCookies];
  }

  *[Symbol.iterator](): Iterator<KeyValuePair> {
    for (const cookie of this.modifiedCookies) {
      if (cookie.value) {
        yield { key: cookie.name, value: cookie.value };
      }
    }

    for (const cookie of this.originalCookies) {
      yield { key: cookie.key, value: cookie.value };
    }
  }

  entries(): IterableIterator<[string, string]> {
    return this.entriesImpl();
  }

  private *entriesImpl(): IterableIterator<[string, string]> {
    for (const pair of this) {
      yield [pair.key, pair.value];
    }
  }

  keys(): IterableIterator<string> {
    return this.keysImpl();
  }

  private *keysImpl(): IterableIterator<string> {
    for (const pair of this) {
      yield pair.key;
    }
  }

  values(): IterableIterator<string> {
    return this.valuesImpl();
  }

  private *valuesImpl(): IterableIterator<string> {
    for (const pair of this) {
      yield pair.value;
    }
  }

  forEach(
    callback: (value: string, key: string, map: CookieMap) => void,
    thisArg?: any,
  ): void {
    for (const pair of this) {
      callback.call(thisArg, pair.value, pair.key, this);
    }
  }

  clear(): void {
    this.originalCookies = [];
    this.modifiedCookies = [];
  }
}
