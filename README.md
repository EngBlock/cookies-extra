# Cookies Extra

A TypeScript library for parsing and managing HTTP cookies, converted from C++ implementations used in Bun runtime.

## Features

- Parse Cookie headers into dictionaries
- Parse Set-Cookie headers into Cookie objects
- Full TypeScript support with comprehensive type definitions
- Cookie validation and serialization
- CookieMap for managing collections of cookies
- Support for all standard cookie attributes (Domain, Path, Secure, HttpOnly, SameSite, etc.)

## Installation

```bash
npm install cookies-extra
```

## Usage

### Basic Cookie Parsing

```typescript
import { parseCookieHeader, parseSetCookieHeader } from 'cookies-extra';

// Parse a Cookie header into a dictionary
const cookies = parseCookieHeader('sessionId=abc123; theme=dark; lang=en');
console.log(cookies);
// { sessionId: 'abc123', theme: 'dark', lang: 'en' }

// Parse a Set-Cookie header into a Cookie object
const cookie = parseSetCookieHeader('sessionId=abc123; Domain=example.com; Secure; HttpOnly');
console.log(cookie.name); // 'sessionId'
console.log(cookie.value); // 'abc123'
console.log(cookie.domain); // 'example.com'
console.log(cookie.secure); // true
```

### Using Cookie Class

```typescript
import { Cookie, CookieSameSite } from 'cookies-extra';

// Create a new cookie
const cookie = Cookie.create({
  name: 'user',
  value: 'john_doe',
  domain: 'example.com',
  path: '/app',
  secure: true,
  httpOnly: true,
  sameSite: CookieSameSite.Strict,
  maxAge: 3600
});

// Serialize to Set-Cookie header format
console.log(cookie.toString());
// "user=john_doe; Domain=example.com; Path=/app; Max-Age=3600; Secure; HttpOnly; SameSite=Strict"

// Parse from Set-Cookie header
const parsed = Cookie.parse('user=john_doe; Domain=example.com; Secure');
```

### Using CookieMap

```typescript
import { CookieMap } from 'cookies-extra';

// Create from various input types
const cookieMap1 = new CookieMap('session=abc; theme=dark');
const cookieMap2 = new CookieMap({ session: 'abc', theme: 'dark' });
const cookieMap3 = new CookieMap([['session', 'abc'], ['theme', 'dark']]);

// Get and set cookies
cookieMap1.set('newCookie', 'value');
console.log(cookieMap1.get('session')); // 'abc'
console.log(cookieMap1.has('theme')); // true

// Convert to plain object
const plain = cookieMap1.toJSON();
console.log(plain); // { session: 'abc', theme: 'dark', newCookie: 'value' }

// Iterate over cookies
for (const [name, value] of cookieMap1) {
  console.log(\`\${name}=\${value}\`);
}
```

### Working with Headers

```typescript
import { createCookieMapFromHeaders, writeSetCookieHeaders } from 'cookies-extra';

// Parse cookies from Headers object
const headers = new Headers({ 'cookie': 'session=abc; theme=dark' });
const cookieMap = createCookieMapFromHeaders(headers);

// Write Set-Cookie headers
const responseHeaders = new Headers();
cookieMap.set(Cookie.create({ name: 'newSession', value: 'xyz789' }));
writeSetCookieHeaders(cookieMap, responseHeaders);
```

## API Reference

### Cookie Class

#### Methods
- `Cookie.create(options)` - Create a new cookie
- `Cookie.parse(cookieString)` - Parse a Set-Cookie header string
- `Cookie.serialize(cookies)` - Serialize an array of cookies to Cookie header format
- `cookie.toString()` - Convert to Set-Cookie header format
- `cookie.toJSON()` - Convert to plain object
- `cookie.isExpired()` - Check if cookie is expired

#### Validation
- `Cookie.isValidCookieName(name)` - Validate cookie name
- `Cookie.isValidCookiePath(path)` - Validate cookie path
- `Cookie.isValidCookieDomain(domain)` - Validate cookie domain

### CookieMap Class

#### Methods
- `new CookieMap(input?)` - Create from string, object, or array
- `get(name)` - Get cookie value
- `set(name, value)` or `set(cookie)` - Set cookie
- `has(name)` - Check if cookie exists
- `delete(name)` - Delete cookie
- `clone()` - Create a copy
- `size()` - Get number of cookies
- `toJSON()` - Convert to plain object
- `entries()`, `keys()`, `values()` - Iterators

### Utility Functions

- `parseCookieHeader(header)` - Parse Cookie header to object
- `parseSetCookieHeader(header)` - Parse Set-Cookie header to Cookie
- `parseSetCookieHeaders(headers)` - Parse multiple Set-Cookie headers
- `createCookieMapFromHeaders(headers)` - Create CookieMap from Headers
- `writeSetCookieHeaders(cookieMap, headers)` - Write to Headers object

## License

MIT