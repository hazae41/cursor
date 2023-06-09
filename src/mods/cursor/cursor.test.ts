import { Bytes } from "@hazae41/bytes";
import { assert, test } from "@hazae41/phobos";
import { Debug } from "@hazae41/result";
import { Cursor } from "mods/cursor/cursor.js";
import { webcrypto } from "node:crypto";
import { relative, resolve } from "node:path";

const directory = resolve("./dist/test/")
const { pathname } = new URL(import.meta.url)
console.log(relative(directory, pathname.replace(".mjs", ".ts")))

Debug.debug = true

test("Allocation", async () => {
  for (let i = 0; i < 32; i++) {
    const cursor = Cursor.alloc(i)
    assert(cursor.bytes.length === i)
    assert(cursor.offset === 0)
  }

  for (let i = 0; i < 32; i++) {
    const cursor = Cursor.allocUnsafe(i)
    assert(cursor.bytes.length === i)
    assert(cursor.offset === 0)
  }
})

test("write then read", async () => {
  const bytes = Bytes.from([1, 2, 3, 4])
  const cursor = Cursor.allocUnsafe(bytes.length)

  cursor.tryWrite(bytes).unwrap()
  assert(cursor.offset === bytes.length)
  assert(Bytes.equals(cursor.inner, bytes))

  cursor.offset = 0

  const bytes2 = cursor.tryRead(bytes.length).unwrap()
  assert(cursor.offset === bytes.length)
  assert(Bytes.equals(cursor.inner, bytes2))

  assert(bytes.length === bytes2.length)
  assert(Bytes.equals(bytes, bytes2))

  const overflowing = Buffer.from([1, 2, 3, 4, 5])

  assert(cursor.tryWrite(overflowing).ignore().isErr())
  assert(cursor.tryRead(overflowing.length).ignore().isErr())
})

test("writeUint8 then readUint8", async () => {
  const cursor = Cursor.allocUnsafe(1)

  const n = 42

  cursor.tryWriteUint8(n).unwrap()
  assert(cursor.offset === 1)
  assert(cursor.inner.length === 1)
  assert(Bytes.equals2(cursor.inner, Bytes.from([n])))

  cursor.offset = 0

  const n2 = cursor.tryReadUint8().unwrap()
  assert(cursor.offset === 1)
  assert(cursor.inner.length === 1)
  assert(Bytes.equals2(cursor.inner, Bytes.from([n])))

  assert(n === n2)

  cursor.offset = 0

  // assert(cursor.tryWriteUint8(2 ** 8).ignore().isErr())
  // assert(cursor.tryWriteUint8(-1).ignore().isErr())
})

test("writeUint16 then readUint16", async () => {
  const cursor = Cursor.allocUnsafe(2)

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
  const cursor = Cursor.allocUnsafe(3)

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
  const cursor = Cursor.allocUnsafe(4)

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
  const cursor = Cursor.alloc(5)

  cursor.offset += 2
  cursor.fill(1, 2)

  const expected = new Uint8Array([0, 0, 1, 1, 0])
  assert(Bytes.equals2(cursor.inner, expected))
})

test("split", async ({ test }) => {
  globalThis.crypto = webcrypto as any

  const cursor = Cursor.random(256)

  const splitter = cursor.trySplit(100)
  const chunks = new Array<Bytes>()

  let result = splitter.next()

  for (; !result.done; result = splitter.next())
    chunks.push(result.value)

  result.value.unwrap()

  assert(chunks[0].length === 100)
  assert(chunks[1].length === 100)
  assert(chunks[2].length === 56)
})