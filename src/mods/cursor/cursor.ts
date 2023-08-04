import { Bytes, BytesAllocError, Sized } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { Buffers } from "libs/buffers/buffers.js"
import { DataViews } from "libs/dataviews/dataviews.js"
import { Utf8 } from "libs/utf8/utf8.js"
import { CursorReadLengthOverflowError, CursorReadNullOverflowError, CursorReadOverflowError, CursorReadUnknownError, CursorWriteError, CursorWriteLengthOverflowError, CursorWriteUnknownError } from "./errors.js"

export class Cursor<T extends ArrayBufferView = ArrayBufferView> {
  readonly #class = Cursor

  #inner: T

  #bytes?: Uint8Array
  #data?: DataView
  #buffer?: Buffer

  offset: number

  /**
   * A cursor for bytes
   * @param inner 
   * @param offset 
   */
  constructor(inner: T, offset = 0) {
    this.#inner = inner
    this.offset = offset
  }

  static new<T extends ArrayBufferView>(inner: T, offset?: number) {
    return new Cursor(inner, offset)
  }

  /**
   * Create a new Cursor using Bytes.empty
   * @deprecated
   * @returns 
   */
  static empty(): Cursor<Bytes<0>> {
    return new Cursor(Bytes.empty())
  }

  /**
   * Create a new Cursor using Bytes.tryEmpty
   * @returns 
   */
  static tryEmpty(): Result<Cursor<Bytes<0>>, BytesAllocError<0>> {
    return Bytes.tryEmpty().mapSync(Cursor.new)
  }

  /**
   * Create a new Cursor using Bytes.alloc
   * @deprecated
   * @param length 
   * @returns Cursor
   */
  static alloc<N extends number>(length: N): Cursor<Bytes<N>> {
    return new Cursor(Bytes.alloc(length))
  }

  /**
   * Create a new Cursor using Bytes.tryAlloc
   * @param length 
   * @returns Cursor
   */
  static tryAlloc<N extends number>(length: N): Result<Cursor<Bytes<N>>, BytesAllocError<N>> {
    return Bytes.tryAlloc(length).mapSync(Cursor.new)
  }

  /**
   * Create a new Cursor using Bytes.allocUnsafe
   * @deprecated
   * @param length 
   * @returns Cursor
   */
  static allocUnsafe<N extends number>(length: N): Cursor<Bytes<N>> {
    return new Cursor(Bytes.allocUnsafe(length))
  }

  /**
   * Create a new Cursor using Bytes.tryAllocUnsafe
   * @param length 
   * @returns Cursor
   */
  static tryAllocUnsafe<N extends number>(length: N): Result<Cursor<Bytes<N>>, BytesAllocError<N>> {
    return Bytes.tryAllocUnsafe(length).mapSync(Cursor.new)
  }

  /**
   * Create a new Cursor using Bytes.from
   * @deprecated
   * @param sized 
   * @returns 
   */
  static from<N extends number>(sized: Sized<number, N>): Cursor<Bytes<N>> {
    return new Cursor(Bytes.from(sized))
  }

  /**
   * Create a new Cursor using Bytes.tryFrom
   * @param sized 
   * @returns 
   */
  static tryFrom<N extends number>(sized: Sized<number, N>): Result<Cursor<Bytes<N>>, BytesAllocError<N>> {
    return Bytes.tryFrom(sized).mapSync(Cursor.new)
  }

  /**
   * Create a new Cursor using Bytes.random
   * @deprecated
   * @param length 
   * @returns Cursor
   */
  static random<N extends number>(length: N): Cursor<Bytes<N>> {
    return new Cursor(Bytes.random(length))
  }

  /**
   * Create a new Cursor using Bytes.tryRandom
   * @param length 
   * @returns Cursor
   */
  static tryRandom<N extends number>(length: N): Result<Cursor<Bytes<N>>, BytesAllocError<N>> {
    return Bytes.tryRandom(length).mapSync(Cursor.new)
  }

  get inner() {
    return this.#inner
  }

  set inner(inner: T) {
    this.#inner = inner

    this.#bytes = undefined
    this.#data = undefined
    this.#buffer = undefined
  }

  get bytes() {
    return this.#bytes ??= Bytes.fromView(this.inner)
  }

  get data() {
    return this.#data ??= DataViews.fromView(this.inner)
  }

  get buffer() {
    return this.#buffer ??= Buffers.fromView(this.inner)
  }

  /**
   * @returns total number of bytes
   */
  get length() {
    return this.bytes.length
  }

  /**
   * @returns number of remaining bytes
   */
  get remaining() {
    return this.length - this.offset
  }

  /**
   * Get a subarray of the bytes before the current offset
   * @returns subarray of the bytes before the current offset
   */
  get before(): Bytes {
    return this.bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after(): Bytes {
    return this.bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  tryGet<N extends number>(length: N): Result<Bytes<N>, CursorReadLengthOverflowError> {
    if (this.remaining < length)
      return new Err(CursorReadLengthOverflowError.from(this, length))

    const subarray = this.bytes.subarray(this.offset, this.offset + length)

    return new Ok(subarray as Bytes<N>)
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  tryRead<N extends number>(length: N): Result<Bytes<N>, CursorReadLengthOverflowError> {
    return this.tryGet(length).inspectSync(() => this.offset += length)
  }

  /**
   * Set an array to the bytes
   * @param array array
   */
  trySet(array: Uint8Array): Result<void, CursorWriteLengthOverflowError> {
    if (this.remaining < array.length)
      return new Err(CursorWriteLengthOverflowError.from(this, array.length))

    return new Ok(this.bytes.set(array, this.offset))
  }

  /**
   * Write an array to the bytes
   * @param array array
   */
  tryWrite(array: Uint8Array): Result<void, CursorWriteLengthOverflowError> {
    return this.trySet(array).inspectSync(() => this.offset += array.length)
  }

  /**
   * Get a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  tryGetUint8(): Result<number, never> {
    return new Ok(this.bytes[this.offset])
  }

  /**
   * Read a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  tryReadUint8(): Result<number, never> {
    return this.tryGetUint8().inspectSync(() => this.offset++)
  }

  /**
   * Set a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  trySetUint8(x: number): Result<void, never> {
    this.bytes[this.offset] = x
    return Ok.void()
  }

  /**
   * Write a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  tryWriteUint8(x: number): Result<void, never> {
    return this.trySetUint8(x).inspectSync(() => this.offset++)
  }

  /**
   * Get a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  tryGetUint16(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      return new Ok(this.data.getUint16(this.offset, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint16 failed`, { cause }))
    }
  }

  /**
   * Read a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  tryReadUint16(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint16(littleEndian).inspectSync(() => this.offset += 2)
  }

  /**
   * Set a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  trySetUint16(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.data.setUint16(this.offset, x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint16 failed`, { cause }))
    }
  }

  /**
   * Write a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  tryWriteUint16(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint16(x, littleEndian).inspectSync(() => this.offset += 2)
  }

  /**
   * Get a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  tryGetUint24(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      if (littleEndian)
        return new Ok(this.buffer.readUIntLE(this.offset, 3))
      else
        return new Ok(this.buffer.readUIntBE(this.offset, 3))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint24 failed`, { cause }))
    }
  }

  /**
   * Read a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  tryReadUint24(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint24(littleEndian).inspectSync(() => this.offset += 3)
  }

  /**
   * Set a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  trySetUint24(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      if (littleEndian)
        this.buffer.writeUIntLE(x, this.offset, 3)
      else
        this.buffer.writeUIntBE(x, this.offset, 3)

      return Ok.void()
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint24 failed`, { cause }))
    }
  }

  /**
   * Write a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  tryWriteUint24(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint24(x, littleEndian).inspectSync(() => this.offset += 3)
  }

  /**
   * Get a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  tryGetUint32(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      return new Ok(this.data.getUint32(this.offset, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint32 failed`, { cause }))
    }
  }

  /**
   * Read a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  tryReadUint32(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint32(littleEndian).inspectSync(() => this.offset += 4)
  }

  /**
   * Set a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  trySetUint32(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.data.setUint32(this.offset, x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint32 failed`, { cause }))
    }
  }

  /**
   * Write a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  tryWriteUint32(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint32(x, littleEndian).inspectSync(() => this.offset += 4)
  }

  /**
   * Get a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  tryGetUint64(littleEndian?: boolean): Result<bigint, CursorReadUnknownError> {
    try {
      return new Ok(this.data.getBigUint64(this.offset, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getBigUint64 failed`, { cause }))
    }
  }

  /**
   * Read a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  tryReadUint64(littleEndian?: boolean): Result<bigint, CursorReadUnknownError> {
    return this.tryGetUint64(littleEndian).inspectSync(() => this.offset += 8)
  }

  /**
   * Set a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  trySetUint64(x: bigint, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.data.setBigUint64(this.offset, x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setBigUint64 failed`, { cause }))
    }
  }

  /**
   * Write a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  tryWriteUint64(x: bigint, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint64(x, littleEndian).inspectSync(() => this.offset += 8)
  }

  /**
   * Zero-copy get a UTF-8 string
   * @warning It can return a string whose length is between (length) and (length / 3)
   * @param length 
   * @returns 
   */
  tryGetUtf8(length: number): Result<string, CursorReadLengthOverflowError> {
    return this.tryGet(length).mapSync(Utf8.decoder.decode)
  }

  /**
   * Zero-copy read a UTF-8 string
   * @warning It can return a string whose length is between (length) and (length / 3)
   * @param length 
   * @returns 
   */
  tryReadUtf8(length: number): Result<string, CursorReadLengthOverflowError> {
    return this.tryRead(length).mapSync(Utf8.decoder.decode)
  }

  /**
   * Zero-copy set a UTF-8 string
   * @warning It can write between (text.length) and (text.length * 3) bytes
   * @param text 
   * @returns 
   */
  trySetUtf8(text: string): Result<void, CursorWriteUnknownError> {
    const result = Utf8.encoder.encodeInto(text, this.after)

    if (result.read! !== text.length)
      return new Err(new CursorWriteUnknownError())
    return Ok.void()
  }

  /**
   * Zero-copy write a UTF-8 string
   * @warning It can write between (text.length) and (text.length * 3) bytes
   * @param text 
   * @returns 
   */
  tryWriteUtf8(text: string): Result<void, CursorWriteUnknownError> {
    const result = Utf8.encoder.encodeInto(text, this.after)

    if (result.read! !== text.length)
      return new Err(new CursorWriteUnknownError())

    this.offset += result.written!
    return Ok.void()
  }

  /**
   * Get the first NULL (byte 0) index relative to the current offset
   */
  tryGetNull(): Result<number, CursorReadNullOverflowError> {
    let i = this.offset

    while (i < this.bytes.length && this.bytes[i] > 0)
      i++

    if (i === this.bytes.length)
      return new Err(CursorReadNullOverflowError.from(this))

    return new Ok(i)
  }

  /**
   * Get a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  tryGetNulled(): Result<Bytes, CursorReadOverflowError> {
    return this.tryGetNull().andThenSync(index => this.tryGet(index))
  }

  /**
   * Read a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  tryReadNulled(): Result<Bytes, CursorReadOverflowError> {
    return this.tryGetNull().andThenSync(index => this.tryRead(index))
  }

  /**
   * Set a NULL-terminated array
   * @param array array
   */
  trySetNulled(array: Bytes): Result<void, CursorWriteError> {
    const start = this.offset
    const result = this.tryWriteNulled(array)
    this.offset = start
    return result
  }

  /**
   * Write a NULL-terminated array
   * @param array array
   */
  tryWriteNulled(array: Bytes): Result<void, CursorWriteError> {
    return this.tryWrite(array).andThenSync(() => this.tryWriteUint8(0))
  }

  /**
   * Get a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  tryGetNulledString(encoding?: BufferEncoding): Result<string, CursorReadOverflowError> {
    return this.tryGetNulled().mapSync(subarray => Buffers.fromView(subarray).toString(encoding))
  }

  /**
   * Read a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  tryReadNulledString(encoding?: BufferEncoding): Result<string, CursorReadOverflowError> {
    return this.tryReadNulled().mapSync(subarray => Buffers.fromView(subarray).toString(encoding))
  }

  /**
   * Set a NULL-terminated string
   * @param text string
   * @param encoding encoding
   */
  trySetNulledString(text: string, encoding?: BufferEncoding): Result<void, CursorWriteError> {
    return this.trySetNulled(Buffer.from(text, encoding))
  }

  /**
   * Write a NULL-terminated string
   * @param text string
   * @param encoding encoding
   */
  tryWriteNulledString(text: string, encoding?: BufferEncoding): Result<void, CursorWriteError> {
    return this.tryWriteNulled(Buffer.from(text, encoding))
  }

  /**
   * Fill length bytes with value after offset
   * @param value value to fill
   * @param length length to fill
   */
  fill(value: number, length: number): void {
    this.bytes.fill(value, this.offset, this.offset + length)
    this.offset += length
  }

  /**
   * Split into chunks of maximum length bytes
   * @param length 
   * @returns 
   */
  *trySplit(length: number): Generator<Bytes, Result<void, CursorReadLengthOverflowError>> {
    while (this.remaining >= length) {
      const subarray = this.tryRead(length)

      if (subarray.isErr())
        return subarray
      else
        yield subarray.get()
    }

    if (this.remaining) {
      const subarray = this.tryRead(this.remaining)

      if (subarray.isErr())
        return subarray
      else
        yield subarray.get()
    }

    return Ok.void()
  }

}