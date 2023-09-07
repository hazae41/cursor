import { assert, test } from "@hazae41/phobos";
import { Result } from "@hazae41/result";
import { Cursor } from "mods/cursor/cursor.js";
import { relative, resolve } from "node:path";

const directory = resolve("./dist/test/")
const { pathname } = new URL(import.meta.url)
console.log(relative(directory, pathname.replace(".mjs", ".ts")))

Result.debug = true

function equals(a: Uint8Array, b: Uint8Array) {
  return Buffer.from(a).equals(Buffer.from(b))
}

test("write then read", async () => {
  const bytes = new Uint8Array([1, 2, 3, 4])
  const cursor = new Cursor(new Uint8Array(bytes.length))

  cursor.tryWrite(bytes).unwrap()
  assert(cursor.offset === bytes.length)
  assert(equals(cursor.inner, bytes))

  cursor.offset = 0

  const bytes2 = cursor.tryRead(bytes.length).unwrap()
  assert(cursor.offset === bytes.length)
  assert(equals(cursor.inner, bytes2))

  assert(bytes.length === bytes2.length)
  assert(equals(bytes, bytes2))

  const overflowing = Buffer.from([1, 2, 3, 4, 5])

  assert(cursor.tryWrite(overflowing).ignore().isErr())
  assert(cursor.tryRead(overflowing.length).ignore().isErr())
})

test("writeUint8 then readUint8", async () => {
  const cursor = new Cursor(new Uint8Array(1))

  const n = 42

  cursor.tryWriteUint8(n).unwrap()
  assert(cursor.offset === 1)
  assert(cursor.inner.length === 1)
  assert(equals(cursor.inner, new Uint8Array([n])))

  cursor.offset = 0

  const n2 = cursor.tryReadUint8().unwrap()
  assert(cursor.offset === 1)
  assert(cursor.inner.length === 1)
  assert(equals(cursor.inner, new Uint8Array([n])))

  assert(n === n2)

  cursor.offset = 0

  // assert(cursor.tryWriteUint8(2 ** 8).ignore().isErr())
  // assert(cursor.tryWriteUint8(-1).ignore().isErr())
})

test("writeUint16 then readUint16", async () => {
  const cursor = new Cursor(new Uint8Array(2))

  const n = 42

  cursor.tryWriteUint16(n).unwrap()
  assert(cursor.offset === 2)
  assert(cursor.inner.length === 2)

  cursor.offset = 0

  const n2 = cursor.tryReadUint16().unwrap()
  assert(cursor.offset === 2)
  assert(cursor.inner.length === 2)

  assert(n === n2)

  cursor.offset = 0

  // assert(cursor.tryWriteUint16(2 ** 16).ignore().isErr())
  // assert(cursor.tryWriteUint16(-1).ignore().isErr())
})

test("writeUint24 then readUint24", async () => {
  const cursor = new Cursor(new Uint8Array(3))

  const n = 42

  cursor.tryWriteUint24(n).unwrap()
  assert(cursor.offset === 3)
  assert(cursor.inner.length === 3)

  cursor.offset = 0

  const n2 = cursor.tryReadUint24().unwrap()
  assert(cursor.offset === 3)
  assert(cursor.inner.length === 3)

  assert(n === n2)

  cursor.offset = 0

  assert(cursor.tryWriteUint24(2 ** 24).ignore().isErr())
  assert(cursor.tryWriteUint24(-1).ignore().isErr())
})

test("writeUint32 then readUint32", async () => {
  const cursor = new Cursor(new Uint8Array(4))

  const n = 42

  cursor.tryWriteUint32(n).unwrap()
  assert(cursor.offset === 4)
  assert(cursor.inner.length === 4)

  cursor.offset = 0

  const n2 = cursor.tryReadUint32().unwrap()
  assert(cursor.offset === 4)
  assert(cursor.inner.length === 4)

  assert(n === n2)

  cursor.offset = 0

  // assert(cursor.tryWriteUint32(2 ** 32).ignore().isErr())
  // assert(cursor.tryWriteUint32(-1).ignore().isErr())
})

test("fill", async ({ test }) => {
  const cursor = new Cursor(new Uint8Array(5))

  cursor.offset += 2
  cursor.fill(1, 2)

  const expected = new Uint8Array([0, 0, 1, 1, 0])
  assert(equals(cursor.inner, expected))
})

test("split", async ({ test }) => {
  const cursor = new Cursor(crypto.getRandomValues(new Uint8Array(256)))

  const splitter = cursor.trySplit(100)
  const chunks = new Array<Uint8Array>()

  let result = splitter.next()

  for (; !result.done; result = splitter.next())
    chunks.push(result.value)

  result.value.unwrap()

  assert(chunks[0].length === 100)
  assert(chunks[1].length === 100)
  assert(chunks[2].length === 56)
})