import { describe, it, expect } from "vitest";
import {
  Cookie,
  CookieSameSite,
  parseCookieHeader,
  parseSetCookieHeader,
  CookieMap,
} from "../index";

describe("Cookie", () => {
  describe("parsing", () => {
    it("should parse a simple cookie", () => {
      const cookie = Cookie.parse("name=value");
      expect(cookie.name).toBe("name");
      expect(cookie.value).toBe("value");
      expect(cookie.domain).toBe("");
      expect(cookie.path).toBe("/");
      expect(cookie.secure).toBe(false);
      expect(cookie.httpOnly).toBe(false);
      expect(cookie.sameSite).toBe(CookieSameSite.Lax);
    });

    it("should parse a cookie with all attributes", () => {
      const cookieString =
        "name=value; Domain=example.com; Path=/path; Expires=Wed, 09 Jun 2021 10:18:14 GMT; Max-Age=3600; Secure; HttpOnly; SameSite=Strict; Partitioned";
      const cookie = Cookie.parse(cookieString);

      expect(cookie.name).toBe("name");
      expect(cookie.value).toBe("value");
      expect(cookie.domain).toBe("example.com");
      expect(cookie.path).toBe("/path");
      expect(cookie.secure).toBe(true);
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.sameSite).toBe(CookieSameSite.Strict);
      expect(cookie.partitioned).toBe(true);
      expect(cookie.maxAge).toBe(3600);
    });

    it("should handle case-insensitive attributes", () => {
      const cookie = Cookie.parse(
        "name=value; SECURE; HTTPONLY; SAMESITE=none",
      );
      expect(cookie.secure).toBe(true);
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.sameSite).toBe(CookieSameSite.None);
    });

    it("should throw on invalid cookie strings", () => {
      expect(() => Cookie.parse("")).toThrow();
      expect(() => Cookie.parse("invalid")).toThrow();
      expect(() => Cookie.parse("=value")).toThrow();
    });
  });

  describe("serialization", () => {
    it("should serialize a simple cookie", () => {
      const cookie = Cookie.create({ name: "test", value: "value" });
      const serialized = cookie.toString();
      expect(serialized).toContain("test=value");
      expect(serialized).toContain("Path=/");
      expect(serialized).toContain("SameSite=Lax");
    });

    it("should serialize with all attributes", () => {
      const cookie = Cookie.create({
        name: "test",
        value: "value",
        domain: "example.com",
        path: "/test",
        secure: true,
        httpOnly: true,
        sameSite: CookieSameSite.Strict,
        partitioned: true,
        maxAge: 3600,
      });

      const serialized = cookie.toString();
      expect(serialized).toContain("test=value");
      expect(serialized).toContain("Domain=example.com");
      expect(serialized).toContain("Path=/test");
      expect(serialized).toContain("Secure");
      expect(serialized).toContain("HttpOnly");
      expect(serialized).toContain("SameSite=Strict");
      expect(serialized).toContain("Partitioned");
      expect(serialized).toContain("Max-Age=3600");
    });

    it("should URL encode values", () => {
      const cookie = Cookie.create({ name: "test", value: "hello world" });
      const serialized = cookie.toString();
      expect(serialized).toContain("test=hello%20world");
    });
  });

  describe("validation", () => {
    it("should validate cookie names", () => {
      expect(Cookie.isValidCookieName("valid_name")).toBe(true);
      expect(Cookie.isValidCookieName("valid-name")).toBe(true);
      expect(Cookie.isValidCookieName("")).toBe(false);
      expect(Cookie.isValidCookieName("invalid name")).toBe(false);
    });

    it("should validate cookie paths", () => {
      expect(Cookie.isValidCookiePath("/valid/path")).toBe(true);
      expect(Cookie.isValidCookiePath("/path-with-dashes")).toBe(true);
      expect(Cookie.isValidCookiePath("")).toBe(true);
    });

    it("should validate cookie domains", () => {
      expect(Cookie.isValidCookieDomain("example.com")).toBe(true);
      expect(Cookie.isValidCookieDomain("sub.example.com")).toBe(true);
      expect(Cookie.isValidCookieDomain("localhost")).toBe(true);
      expect(Cookie.isValidCookieDomain("")).toBe(true);
    });
  });
});

describe("CookieMap", () => {
  describe("creation", () => {
    it("should create from cookie string", () => {
      const cookieMap = new CookieMap("name1=value1; name2=value2");
      expect(cookieMap.get("name1")).toBe("value1");
      expect(cookieMap.get("name2")).toBe("value2");
    });

    it("should create from record", () => {
      const cookieMap = new CookieMap({ name1: "value1", name2: "value2" });
      expect(cookieMap.get("name1")).toBe("value1");
      expect(cookieMap.get("name2")).toBe("value2");
    });

    it("should create from array", () => {
      const cookieMap = new CookieMap([
        ["name1", "value1"],
        ["name2", "value2"],
      ]);
      expect(cookieMap.get("name1")).toBe("value1");
      expect(cookieMap.get("name2")).toBe("value2");
    });
  });

  describe("operations", () => {
    it("should get and set cookies", () => {
      const cookieMap = new CookieMap();
      cookieMap.set("name", "value");
      expect(cookieMap.get("name")).toBe("value");
      expect(cookieMap.has("name")).toBe(true);
    });

    it("should delete cookies", () => {
      const cookieMap = new CookieMap("name=value");
      expect(cookieMap.has("name")).toBe(true);
      cookieMap.delete("name");
      expect(cookieMap.has("name")).toBe(false);
    });

    it("should clone properly", () => {
      const original = new CookieMap("name=value");
      const clone = original.clone();
      clone.set("name2", "value2");

      expect(original.has("name2")).toBe(false);
      expect(clone.has("name2")).toBe(true);
    });

    it("should iterate over cookies", () => {
      const cookieMap = new CookieMap("name1=value1; name2=value2");
      const entries = Array.from(cookieMap.entries());

      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(["name1", "value1"]);
      expect(entries).toContainEqual(["name2", "value2"]);
    });
  });

  describe("toJSON", () => {
    it("should convert to plain object", () => {
      const cookieMap = new CookieMap("name1=value1; name2=value2");
      const json = cookieMap.toJSON();

      expect(json).toEqual({
        name1: "value1",
        name2: "value2",
      });
    });

    it("should prioritize modified cookies", () => {
      const cookieMap = new CookieMap("name=original");
      cookieMap.set("name", "modified");

      const json = cookieMap.toJSON();
      expect(json.name).toBe("modified");
    });
  });
});

describe("parseCookieHeader", () => {
  it("should parse a cookie header string", () => {
    const result = parseCookieHeader("name1=value1; name2=value2");
    expect(result).toEqual({
      name1: "value1",
      name2: "value2",
    });
  });

  it("should handle URL encoded values", () => {
    const result = parseCookieHeader("name=hello%20world");
    expect(result.name).toBe("hello world");
  });

  it("should handle empty header", () => {
    const result = parseCookieHeader("");
    expect(result).toEqual({});
  });
});

describe("parseSetCookieHeader", () => {
  it("should parse a Set-Cookie header", () => {
    const cookie = parseSetCookieHeader(
      "name=value; Domain=example.com; Secure",
    );
    expect(cookie.name).toBe("name");
    expect(cookie.value).toBe("value");
    expect(cookie.domain).toBe("example.com");
    expect(cookie.secure).toBe(true);
  });
});
