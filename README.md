# Cursor

Rust-like Cursor for TypeScript

```bash
npm install @hazae41/cursor
```

```bash
deno install jsr:@hazae41/cursor
```

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/cursor) • [**📦 JSR**](https://jsr.io/@hazae41/cursor)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Zero-copy reading and writing
- Rust-like patterns
- Unit-tested

## Usage

### Cursor

#### Writing

```typescript
const cursor = new Cursor(new Uint8Array(1024))

cursor.writeUint8OrThrow(123)
cursor.writeUint16OrThrow(1234)

console.log(cursor.offset) // 3
```

#### Reading

```typescript
const cursor = new Cursor(new Uint8Array(/*...*/))

const uint8 = cursor.readUint8OrThrow()
const uint16 = cursor.readUint16OrThrow()

console.log(cursor.offset) // 3
```