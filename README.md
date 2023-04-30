# Cursor

```bash
npm i @hazae41/cursor
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/cursor)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Zero-copy reading and writing
- Unit-tested

## Usage

### Cursor

#### Writing

```typescript
const cursor = Cursor.allocUnsafe(1024)

cursor.writeUint8(123).unwrap()
cursor.writeUint16(1234).unwrap()

console.log(cursor.offset) // 3
```

#### Reading

```typescript
const bytes = new Uint8Array(/*...*/)
const cursor = new Cursor(bytes)

const uint8 = cursor.readUint8().unwrap()
const uint16 = cursor.readUint16().unwrap()

console.log(cursor.offset) // 3
```