import { Err, Ok, Result } from "@hazae41/result"
import { Buffers } from "libs/buffers/buffers.js"
import { Uint8Arrays } from "libs/bytes/bytes.js"
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
    return this.#bytes ??= Uint8Arrays.fromView(this.inner)
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
  get before(): Uint8Array {
    return this.bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after(): Uint8Array {
    return this.bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  getOrThrow<N extends number>(length: N): Uint8Array & { length: N } {
    if (this.remaining < length)
      throw CursorReadLengthOverflowError.from(this, length)
    return this.bytes.subarray(this.offset, this.offset + length) as Uint8Array & { length: N }
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  tryGet<N extends number>(length: N): Result<Uint8Array & { length: N }, CursorReadLengthOverflowError> {
    if (this.remaining < length)
      return new Err(CursorReadLengthOverflowError.from(this, length))
    return new Ok(this.bytes.subarray(this.offset, this.offset + length) as Uint8Array & { length: N })
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  readOrThrow<N extends number>(length: N): Uint8Array & { length: N } {
    const subarray = this.getOrThrow(length)
    this.offset += length
    return subarray
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  tryRead<N extends number>(length: N): Result<Uint8Array & { length: N }, CursorReadLengthOverflowError> {
    return this.tryGet(length).inspectSync(() => this.offset += length)
  }

  /**
   * Set an array to the bytes
   * @param array array
   */
  setOrThrow(array: Uint8Array): void {
    if (this.remaining < array.length)
      throw CursorWriteLengthOverflowError.from(this, array.length)
    this.bytes.set(array, this.offset)
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
  writeOrThrow(array: Uint8Array): void {
    this.setOrThrow(array)
    this.offset += array.length
  }

  /**
   * Write an array to the bytes
   * @param array array
   */
  tryWrite(array: Uint8Array): Result<void, CursorWriteLengthOverflowError> {
    return this.trySet(array).inspectSync(() => this.offset += array.length)
  }

  getUint8OrThrow(): number {
    return this.bytes[this.offset]
  }

  /**
   * Get a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  tryGetUint8(): Result<number, never> {
    return new Ok(this.bytes[this.offset])
  }

  readUint8OrThrow(): number {
    const x = this.getUint8OrThrow()
    this.offset++
    return x
  }

  /**
   * Read a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  tryReadUint8(): Result<number, never> {
    return this.tryGetUint8().inspectSync(() => this.offset++)
  }

  setUint8OrThrow(x: number): void {
    this.bytes[this.offset] = x
  }

  /**
   * Set a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  trySetUint8(x: number): Result<void, never> {
    this.bytes[this.offset] = x
    return Ok.void()
  }

  writeUint8OrThrow(x: number): void {
    this.setUint8OrThrow(x)
    this.offset++
  }

  /**
   * Write a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  tryWriteUint8(x: number): Result<void, never> {
    return this.trySetUint8(x).inspectSync(() => this.offset++)
  }

  getUint16OrThrow(littleEndian?: boolean): number {
    return this.data.getUint16(this.offset, littleEndian)
  }

  /**
   * Get a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  tryGetUint16(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      return new Ok(this.getUint16OrThrow(littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint16 failed`, { cause }))
    }
  }

  readUint16OrThrow(littleEndian?: boolean): number {
    const x = this.getUint16OrThrow(littleEndian)
    this.offset += 2
    return x
  }

  /**
   * Read a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  tryReadUint16(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint16(littleEndian).inspectSync(() => this.offset += 2)
  }

  setUint16OrThrow(x: number, littleEndian?: boolean): void {
    this.data.setUint16(this.offset, x, littleEndian)
  }

  /**
   * Set a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  trySetUint16(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.setUint16OrThrow(x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint16 failed`, { cause }))
    }
  }

  writeUint16OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint16OrThrow(x, littleEndian)
    this.offset += 2
  }

  /**
   * Write a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  tryWriteUint16(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint16(x, littleEndian).inspectSync(() => this.offset += 2)
  }

  getUint24OrThrow(littleEndian?: boolean): number {
    if (littleEndian)
      return this.buffer.readUIntLE(this.offset, 3)
    else
      return this.buffer.readUIntBE(this.offset, 3)
  }

  /**
   * Get a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  tryGetUint24(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      return new Ok(this.getUint24OrThrow(littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint24 failed`, { cause }))
    }
  }

  readUint24OrThrow(littleEndian?: boolean): number {
    const x = this.getUint24OrThrow(littleEndian)
    this.offset += 3
    return x
  }

  /**
   * Read a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  tryReadUint24(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint24(littleEndian).inspectSync(() => this.offset += 3)
  }

  setUint24OrThrow(x: number, littleEndian?: boolean): void {
    if (littleEndian)
      this.buffer.writeUIntLE(x, this.offset, 3)
    else
      this.buffer.writeUIntBE(x, this.offset, 3)
  }

  /**
   * Set a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  trySetUint24(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.setUint24OrThrow(x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint24 failed`, { cause }))
    }
  }

  writeUint24OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint24OrThrow(x, littleEndian)
    this.offset += 3
  }

  /**
   * Write a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  tryWriteUint24(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint24(x, littleEndian).inspectSync(() => this.offset += 3)
  }

  getUint32OrThrow(littleEndian?: boolean): number {
    return this.data.getUint32(this.offset, littleEndian)
  }

  /**
   * Get a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  tryGetUint32(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    try {
      return new Ok(this.getUint32OrThrow(littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getUint32 failed`, { cause }))
    }
  }

  readUint32OrThrow(littleEndian?: boolean): number {
    const x = this.getUint32OrThrow(littleEndian)
    this.offset += 4
    return x
  }

  /**
   * Read a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  tryReadUint32(littleEndian?: boolean): Result<number, CursorReadUnknownError> {
    return this.tryGetUint32(littleEndian).inspectSync(() => this.offset += 4)
  }

  setUint32OrThrow(x: number, littleEndian?: boolean): void {
    this.data.setUint32(this.offset, x, littleEndian)
  }

  /**
   * Set a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  trySetUint32(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.setUint32OrThrow(x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setUint32 failed`, { cause }))
    }
  }

  writeUint32OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint32OrThrow(x, littleEndian)
    this.offset += 4
  }

  /**
   * Write a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  tryWriteUint32(x: number, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint32(x, littleEndian).inspectSync(() => this.offset += 4)
  }

  getUint64OrThrow(littleEndian?: boolean): bigint {
    return this.data.getBigUint64(this.offset, littleEndian)
  }

  /**
   * Get a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  tryGetUint64(littleEndian?: boolean): Result<bigint, CursorReadUnknownError> {
    try {
      return new Ok(this.getUint64OrThrow(littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorReadUnknownError(`getBigUint64 failed`, { cause }))
    }
  }

  readUint64OrThrow(littleEndian?: boolean): bigint {
    const x = this.getUint64OrThrow(littleEndian)
    this.offset += 8
    return x
  }

  /**
   * Read a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  tryReadUint64(littleEndian?: boolean): Result<bigint, CursorReadUnknownError> {
    return this.tryGetUint64(littleEndian).inspectSync(() => this.offset += 8)
  }

  setUint64OrThrow(x: bigint, littleEndian?: boolean): void {
    this.data.setBigUint64(this.offset, x, littleEndian)
  }

  /**
   * Set a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  trySetUint64(x: bigint, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    try {
      return new Ok(this.setUint64OrThrow(x, littleEndian))
    } catch (cause: unknown) {
      return new Err(new CursorWriteUnknownError(`setBigUint64 failed`, { cause }))
    }
  }

  writeUint64OrThrow(x: bigint, littleEndian?: boolean): void {
    this.setUint64OrThrow(x, littleEndian)
    this.offset += 8
  }

  /**
   * Write a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  tryWriteUint64(x: bigint, littleEndian?: boolean): Result<void, CursorWriteUnknownError> {
    return this.trySetUint64(x, littleEndian).inspectSync(() => this.offset += 8)
  }

  getUtf8OrThrow(length: number): string {
    return Utf8.decoder.decode(this.getOrThrow(length))
  }

  /**
   * Zero-copy get a UTF-8 string
   * @warning It can return a string whose length is between (length) and (length / 3)
   * @param length 
   * @returns 
   */
  tryGetUtf8(length: number): Result<string, CursorReadLengthOverflowError> {
    return this.tryGet(length).mapSync(x => Utf8.decoder.decode(x))
  }

  readUtf8OrThrow(length: number): string {
    return Utf8.decoder.decode(this.readOrThrow(length))
  }

  /**
   * Zero-copy read a UTF-8 string
   * @warning It can return a string whose length is between (length) and (length / 3)
   * @param length 
   * @returns 
   */
  tryReadUtf8(length: number): Result<string, CursorReadLengthOverflowError> {
    return this.tryRead(length).mapSync(x => Utf8.decoder.decode(x))
  }

  setUtf8OrThrow(text: string): void {
    const result = Utf8.encoder.encodeInto(text, this.after)

    if (result.read! !== text.length)
      throw new CursorWriteUnknownError()
    return
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

  writeUtf8OrThrow(text: string): void {
    const result = Utf8.encoder.encodeInto(text, this.after)

    if (result.read! !== text.length)
      throw new CursorWriteUnknownError()

    this.offset += result.written!
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

  getNullOrThrow(): number {
    let i = this.offset

    while (i < this.bytes.length && this.bytes[i] > 0)
      i++

    if (i === this.bytes.length)
      throw CursorReadNullOverflowError.from(this)

    return i
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

  getNulledOrThrow(): Uint8Array {
    return this.getOrThrow(this.getNullOrThrow())
  }

  /**
   * Get a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  tryGetNulled(): Result<Uint8Array, CursorReadOverflowError> {
    return this.tryGetNull().andThenSync(index => this.tryGet(index))
  }

  readNulledOrThrow(): Uint8Array {
    return this.readOrThrow(this.getNullOrThrow())
  }

  /**
   * Read a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  tryReadNulled(): Result<Uint8Array, CursorReadOverflowError> {
    return this.tryGetNull().andThenSync(index => this.tryRead(index))
  }

  setNulledOrThrow(array: Uint8Array): void {
    const start = this.offset

    try {
      this.writeNulledOrThrow(array)
    } finally {
      this.offset = start
    }
  }

  /**
   * Set a NULL-terminated array
   * @param array array
   */
  trySetNulled(array: Uint8Array): Result<void, CursorWriteError> {
    const start = this.offset
    const result = this.tryWriteNulled(array)
    this.offset = start
    return result
  }

  writeNulledOrThrow(array: Uint8Array): void {
    this.writeOrThrow(array)
    this.writeUint8OrThrow(0)
  }

  /**
   * Write a NULL-terminated array
   * @param array array
   */
  tryWriteNulled(array: Uint8Array): Result<void, CursorWriteError> {
    return this.tryWrite(array).andThenSync(() => this.tryWriteUint8(0))
  }

  getNulledStringOrThrow(encoding?: BufferEncoding): string {
    return Buffers.fromView(this.getNulledOrThrow()).toString(encoding)
  }

  /**
   * Get a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  tryGetNulledString(encoding?: BufferEncoding): Result<string, CursorReadOverflowError> {
    return this.tryGetNulled().mapSync(subarray => Buffers.fromView(subarray).toString(encoding))
  }

  readNulledStringOrThrow(encoding?: BufferEncoding): string {
    return Buffers.fromView(this.readNulledOrThrow()).toString(encoding)
  }

  /**
   * Read a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  tryReadNulledString(encoding?: BufferEncoding): Result<string, CursorReadOverflowError> {
    return this.tryReadNulled().mapSync(subarray => Buffers.fromView(subarray).toString(encoding))
  }

  setNulledStringOrThrow(text: string, encoding?: BufferEncoding): void {
    this.setNulledOrThrow(Buffer.from(text, encoding))
  }

  /**
   * Set a NULL-terminated string
   * @param text string
   * @param encoding encoding
   */
  trySetNulledString(text: string, encoding?: BufferEncoding): Result<void, CursorWriteError> {
    return this.trySetNulled(Buffer.from(text, encoding))
  }

  writeNulledStringOrThrow(text: string, encoding?: BufferEncoding): void {
    this.writeNulledOrThrow(Buffer.from(text, encoding))
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

  *splitOrThrow(length: number): Generator<Uint8Array, void> {
    while (this.remaining >= length)
      yield this.readOrThrow(length)

    if (this.remaining)
      yield this.readOrThrow(this.remaining)

    return
  }

  /**
   * Split into chunks of maximum length bytes
   * @param length 
   * @returns 
   */
  *trySplit(length: number): Generator<Uint8Array, Result<void, CursorReadLengthOverflowError>> {
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