# Cursor

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
const cursor = Cursor.allocUnsafe(1024)

cursor.tryWriteUint8(123).unwrap()
cursor.tryWriteUint16(1234).unwrap()

console.log(cursor.offset) // 3
```

#### Reading

```typescript
const bytes = new Uint8Array(/*...*/)
const cursor = new Cursor(bytes)

const uint8 = cursor.tryReadUint8().unwrap()
const uint16 = cursor.tryReadUint16().unwrap()

console.log(cursor.offset) // 3
```