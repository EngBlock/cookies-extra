export enum CookieSameSite {
  Strict = "Strict",
  Lax = "Lax",
  None = "None",
}

export interface CookieOptions {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  secure?: boolean;
  sameSite?: CookieSameSite;
  httpOnly?: boolean;
  maxAge?: number;
  partitioned?: boolean;
}

export interface CookieStoreDeleteOptions {
  name: string;
  domain?: string;
  path?: string;
}

export class Cookie {
  public readonly name: string;
  public readonly value: string;
  public readonly domain: string;
  public readonly path: string;
  public readonly expires: number;
  public readonly secure: boolean;
  public readonly sameSite: CookieSameSite;
  public readonly httpOnly: boolean;
  public readonly maxAge: number;
  public readonly partitioned: boolean;

  private static readonly EMPTY_EXPIRES_VALUE = -1;

  constructor(options: CookieOptions) {
    if (!Cookie.isValidCookieName(options.name)) {
      throw new TypeError("Invalid cookie name: contains invalid characters");
    }
    if (options.path && !Cookie.isValidCookiePath(options.path)) {
      throw new TypeError("Invalid cookie path: contains invalid characters");
    }
    if (options.domain && !Cookie.isValidCookieDomain(options.domain)) {
      throw new TypeError("Invalid cookie domain: contains invalid characters");
    }

    this.name = options.name;
    this.value = options.value;
    this.domain = options.domain || "";
    this.path = options.path || "/";
    this.expires = options.expires || Cookie.EMPTY_EXPIRES_VALUE;
    this.secure = options.secure || false;
    this.sameSite = options.sameSite || CookieSameSite.Lax;
    this.httpOnly = options.httpOnly || false;
    this.maxAge = options.maxAge || NaN;
    this.partitioned = options.partitioned || false;
  }

  static create(options: CookieOptions): Cookie {
    return new Cookie(options);
  }

  static parse(cookieString: string): Cookie {
    if (cookieString.length < 2) {
      throw new TypeError("Invalid cookie string: empty");
    }

    const firstSemicolonPos = cookieString.indexOf(";");
    const cookiePair =
      firstSemicolonPos === -1
        ? cookieString
        : cookieString.substring(0, firstSemicolonPos);

    const firstEqualsPos = cookiePair.indexOf("=");
    if (firstEqualsPos === -1) {
      throw new TypeError("Invalid cookie string: no '=' found");
    }

    const name = cookiePair.substring(0, firstEqualsPos).trim();
    if (name.length === 0) {
      throw new TypeError("Invalid cookie string: name cannot be empty");
    }

    const value = cookiePair.substring(firstEqualsPos + 1).trim();

    let domain = "";
    let path = "/";
    let expires = Cookie.EMPTY_EXPIRES_VALUE;
    let secure = false;
    let sameSite = CookieSameSite.Lax;
    let httpOnly = false;
    let maxAge = NaN;
    let partitioned = false;
    let hasMaxAge = false;

    if (firstSemicolonPos !== -1) {
      const attributesString = cookieString.substring(firstSemicolonPos + 1);
      const attributes = attributesString.split(";");

      for (const attribute of attributes) {
        const trimmedAttribute = attribute.trim();
        const assignmentPos = trimmedAttribute.indexOf("=");

        let attributeName: string;
        let attributeValue: string;

        if (assignmentPos !== -1) {
          attributeName = trimmedAttribute
            .substring(0, assignmentPos)
            .trim()
            .toLowerCase();
          attributeValue = trimmedAttribute.substring(assignmentPos + 1).trim();
        } else {
          attributeName = trimmedAttribute.toLowerCase();
          attributeValue = "";
        }

        switch (attributeName) {
          case "domain":
            if (attributeValue) {
              domain = attributeValue.toLowerCase();
            }
            break;
          case "path":
            if (attributeValue && attributeValue.startsWith("/")) {
              path = attributeValue;
            }
            break;
          case "expires":
            if (!hasMaxAge && attributeValue) {
              const parsed = Date.parse(attributeValue);
              if (!isNaN(parsed)) {
                expires = parsed;
              }
            }
            break;
          case "max-age":
            const parsedMaxAge = parseInt(attributeValue, 10);
            if (!isNaN(parsedMaxAge)) {
              maxAge = parsedMaxAge;
              hasMaxAge = true;
            }
            break;
          case "secure":
            secure = true;
            break;
          case "httponly":
            httpOnly = true;
            break;
          case "partitioned":
            partitioned = true;
            break;
          case "samesite":
            const lowerValue = attributeValue.toLowerCase();
            if (lowerValue === "strict") {
              sameSite = CookieSameSite.Strict;
            } else if (lowerValue === "lax") {
              sameSite = CookieSameSite.Lax;
            } else if (lowerValue === "none") {
              sameSite = CookieSameSite.None;
            }
            break;
        }
      }
    }

    return Cookie.create({
      name,
      value,
      domain,
      path,
      expires,
      secure,
      sameSite,
      httpOnly,
      maxAge,
      partitioned,
    });
  }

  static serialize(cookies: Cookie[]): string {
    if (cookies.length === 0) {
      return "";
    }

    return cookies
      .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
      .join("; ");
  }

  isExpired(): boolean {
    if (this.expires === Cookie.EMPTY_EXPIRES_VALUE || this.expires < 1) {
      return false;
    }

    const currentTime = Date.now();
    return currentTime > this.expires;
  }

  hasExpiry(): boolean {
    return this.expires !== Cookie.EMPTY_EXPIRES_VALUE && this.expires >= 1;
  }

  toString(): string {
    const parts: string[] = [];

    parts.push(`${this.name}=${encodeURIComponent(this.value)}`);

    if (this.domain) {
      parts.push(`Domain=${this.domain}`);
    }

    if (this.path) {
      parts.push(`Path=${this.path}`);
    }

    if (this.hasExpiry()) {
      parts.push(`Expires=${new Date(this.expires).toUTCString()}`);
    }

    if (!isNaN(this.maxAge)) {
      parts.push(`Max-Age=${this.maxAge}`);
    }

    if (this.secure) {
      parts.push("Secure");
    }

    if (this.httpOnly) {
      parts.push("HttpOnly");
    }

    if (this.partitioned) {
      parts.push("Partitioned");
    }

    parts.push(`SameSite=${this.sameSite}`);

    return parts.join("; ");
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {
      name: this.name,
      value: this.value,
      path: this.path,
      secure: this.secure,
      sameSite: this.sameSite,
      httpOnly: this.httpOnly,
      partitioned: this.partitioned,
    };

    if (this.domain) {
      result.domain = this.domain;
    }

    if (this.hasExpiry()) {
      result.expires = new Date(this.expires);
    }

    if (!isNaN(this.maxAge)) {
      result.maxAge = this.maxAge;
    }

    return result;
  }

  private static isValidCharacterInCookieName(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x21 && code <= 0x3a) ||
      code === 0x3c ||
      (code >= 0x3e && code <= 0x7e)
    );
  }

  static isValidCookieName(name: string): boolean {
    if (name.length === 0) return false;

    for (let i = 0; i < name.length; i++) {
      if (!Cookie.isValidCharacterInCookieName(name[i])) {
        return false;
      }
    }
    return true;
  }

  private static isValidCharacterInCookiePath(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x20 && code <= 0x3a) || (code >= 0x3d && code <= 0x7e);
  }

  static isValidCookiePath(path: string): boolean {
    for (let i = 0; i < path.length; i++) {
      if (!Cookie.isValidCharacterInCookiePath(path[i])) {
        return false;
      }
    }
    return true;
  }

  private static isValidCharacterInCookieDomain(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 46 ||
      code === 45
    );
  }

  static isValidCookieDomain(domain: string): boolean {
    for (let i = 0; i < domain.length; i++) {
      if (!Cookie.isValidCharacterInCookieDomain(domain[i])) {
        return false;
      }
    }
    return true;
  }
}
