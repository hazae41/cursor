import { Bytes } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { Buffers } from "libs/buffers/buffers.js"
import { DataViews } from "libs/dataviews/dataviews.js"

export class Cursor<T extends ArrayBufferView = ArrayBufferView> {
  readonly #class = Cursor

  #inner: T

  #bytes: Uint8Array
  #data: DataView
  #buffer: Buffer

  offset: number

  /**
   * A cursor for bytes
   * @param inner 
   * @param offset 
   */
  constructor(inner: T, offset = 0) {
    this.#inner = inner

    this.#bytes = Bytes.fromView(inner)
    this.#data = DataViews.fromView(inner)
    this.#buffer = Buffers.fromView(inner)

    this.offset = offset
  }

  get inner() {
    return this.#inner
  }

  set inner(inner: T) {
    this.#inner = inner

    this.#bytes = Bytes.fromView(inner)
    this.#data = DataViews.fromView(inner)
    this.#buffer = Buffers.fromView(inner)
  }

  get bytes() {
    return this.#bytes
  }

  get data() {
    return this.#data
  }

  get buffer() {
    return this.#buffer
  }

  /**
   * Create a new Binary using Buffer.alloc
   * @param length 
   * @returns Binary
   */
  static alloc<N extends number>(length: N) {
    return new this(Bytes.alloc(length))
  }

  /**
   * Create a new Binary using Buffer.allocUnsafe
   * @param length 
   * @returns Binary
   */
  static allocUnsafe<N extends number>(length: N) {
    return new this(Bytes.allocUnsafe(length))
  }

  /**
   * Create a new Binary with random bytes
   * @param length 
   * @returns Binary
   */
  static random<N extends number>(length: N) {
    return new this(Bytes.random(length))
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
  get before() {
    return this.bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after() {
    return this.bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  get<N extends number>(length: N): Result<Bytes<N>, Error> {
    if (this.remaining < length)
      return Err.error(`${this.#class.name}.get() overflow`)

    const subarray = this.bytes.subarray(this.offset, this.offset + length)

    return new Ok(subarray as Bytes<N>)
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @param shallow 
   * @returns subarray of the bytes
   */
  read<N extends number>(length: N): Result<Bytes<N>, Error> {
    const subarray = this.get(length)

    if (subarray.isOk())
      this.offset += length

    return subarray
  }

  /**
   * Set an array to the bytes
   * @param array array
   */
  set(array: Uint8Array): Result<void, Error> {
    if (this.remaining < array.length)
      return Err.error(`${this.#class.name}.set() overflow`)

    return new Ok(this.bytes.set(array, this.offset))
  }

  /**
   * Write an array to the bytes
   * @param array array
   */
  write(array: Uint8Array): Result<void, Error> {
    const result = this.set(array)

    if (result.isOk())
      this.offset += array.length

    return result
  }

  /**
   * Get a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  getUint8(): Result<number, Error> {
    try {
      return new Ok(this.data.getUint8(this.offset))
    } catch (e: unknown) {
      return Err.error(`Cursor.getUint8 failed`)
    }
  }

  /**
   * Read a 8-bits unsigned number
   * @returns 8-bits unsigned number
   */
  readUint8(): Result<number, Error> {
    const x = this.getUint8()

    if (x.isOk())
      this.offset++

    return x
  }

  /**
   * Set a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  setUint8(x: number): Result<void, Error> {
    try {
      return new Ok(this.data.setUint8(this.offset, x))
    } catch (e: unknown) {
      return Err.error(`Cursor.setUint8 failed`)
    }
  }

  /**
   * Write a 8-bits unsigned number
   * @param x 8-bits unsigned number
   */
  writeUint8(x: number): Result<void, Error> {
    const result = this.setUint8(x)

    if (result.isOk())
      this.offset++

    return result
  }

  /**
   * Get a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  getUint16(littleEndian?: boolean): Result<number, Error> {
    try {
      return new Ok(this.data.getUint16(this.offset, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.getUint16 failed`)
    }
  }

  /**
   * Read a 16-bits unsigned number
   * @returns 16-bits unsigned number
   */
  readUint16(littleEndian?: boolean): Result<number, Error> {
    const x = this.getUint16(littleEndian)

    if (x.isOk())
      this.offset += 2

    return x
  }

  /**
   * Set a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  setUint16(x: number, littleEndian?: boolean): Result<void, Error> {
    try {
      return new Ok(this.data.setUint16(this.offset, x, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.setUint16 failed`)
    }
  }

  /**
   * Write a 16-bits unsigned number
   * @param x 16-bits unsigned number
   */
  writeUint16(x: number, littleEndian?: boolean): Result<void, Error> {
    const result = this.setUint16(x, littleEndian)

    if (result.isOk())
      this.offset += 2

    return result
  }

  /**
   * Get a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  getUint24(littleEndian?: boolean): Result<number, Error> {
    try {
      return littleEndian
        ? new Ok(this.buffer.readUIntLE(this.offset, 3))
        : new Ok(this.buffer.readUIntBE(this.offset, 3));
    } catch (e: unknown) {
      return Err.error(`Cursor.getUint24 failed`)
    }
  }

  /**
   * Read a 24-bits unsigned number
   * @returns 24-bits unsigned number
   */
  readUint24(littleEndian?: boolean): Result<number, Error> {
    const x = this.getUint24(littleEndian)

    if (x.isOk())
      this.offset += 3

    return x
  }

  /**
   * Set a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  setUint24(x: number, littleEndian?: boolean): Result<void, Error> {
    try {
      if (littleEndian)
        this.buffer.writeUIntLE(x, this.offset, 3)
      else
        this.buffer.writeUIntBE(x, this.offset, 3)

      return new Ok<void>(undefined)
    } catch (e: unknown) {
      return Err.error(`Cursor.setUint24 failed`)
    }
  }

  /**
   * Write a 24-bits unsigned number
   * @param x 24-bits unsigned number
   */
  writeUint24(x: number, littleEndian?: boolean): Result<void, Error> {
    const result = this.setUint24(x, littleEndian)

    if (result.isOk())
      this.offset += 3

    return result
  }

  /**
   * Get a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  getUint32(littleEndian?: boolean): Result<number, Error> {
    try {
      return new Ok(this.data.getUint32(this.offset, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.getUint32 failed`)
    }
  }

  /**
   * Read a 32-bits unsigned number
   * @returns 32-bits unsigned number
   */
  readUint32(littleEndian?: boolean): Result<number, Error> {
    const x = this.getUint32(littleEndian)

    if (x.isOk())
      this.offset += 4

    return x
  }

  /**
   * Set a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  setUint32(x: number, littleEndian?: boolean): Result<void, Error> {
    try {
      return new Ok(this.data.setUint32(this.offset, x, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.setUint32 failed`)
    }
  }

  /**
   * Write a 32-bits unsigned number
   * @param x 32-bits unsigned number
   */
  writeUint32(x: number, littleEndian?: boolean): Result<void, Error> {
    const result = this.setUint32(x, littleEndian)

    if (result.isOk())
      this.offset += 4

    return result
  }

  /**
   * Get a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  getUint64(littleEndian?: boolean): Result<bigint, Error> {
    try {
      return new Ok(this.data.getBigUint64(this.offset, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.getUint64 failed`)
    }
  }

  /**
   * Read a 64-bits unsigned number
   * @returns 64-bits unsigned number
   */
  readUint64(littleEndian?: boolean): Result<bigint, Error> {
    const x = this.getUint64(littleEndian)

    if (x.isOk())
      this.offset += 8

    return x
  }

  /**
   * Set a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  setUint64(x: bigint, littleEndian?: boolean): Result<void, Error> {
    try {
      return new Ok(this.data.setBigUint64(this.offset, x, littleEndian))
    } catch (e: unknown) {
      return Err.error(`Cursor.setUint64 failed`)
    }
  }

  /**
   * Write a 64-bits unsigned number
   * @param x 64-bits unsigned number
   */
  writeUint64(x: bigint, littleEndian?: boolean) {
    const result = this.setUint64(x, littleEndian)

    if (result.isOk())
      this.offset += 8

    return result
  }

  /**
   * Get a fixed-length string
   * @param length byte length of the string
   * @param encoding encoding
   * @returns string
   */
  getString(length: number, encoding?: BufferEncoding): Result<string, Error> {
    const subarray = this.get(length)

    if (subarray.isErr())
      return subarray

    return new Ok(Buffers.fromView(subarray.inner).toString(encoding))
  }

  /**
   * Read a fixed-length string
   * @param length byte length of the string
   * @param encoding encoding
   * @returns string
   */
  readString(length: number, encoding?: BufferEncoding): Result<string, Error> {
    const subarray = this.read(length)

    if (subarray.isErr())
      return subarray

    return new Ok(Buffers.fromView(subarray.inner).toString(encoding))
  }

  /**
   * Set a fixed-length string
   * @param text string
   * @param encoding encoding
   */
  setString(text: string, encoding?: BufferEncoding): Result<void, Error> {
    return this.set(Buffer.from(text, encoding))
  }

  /**
   * Write a fixed-length string
   * @param text string
   * @param encoding encoding
   */
  writeString(text: string, encoding?: BufferEncoding): Result<void, Error> {
    return this.write(Buffer.from(text, encoding))
  }

  /**
   * Get the first NULL (byte 0) index relative to the current offset
   */
  get null(): Result<number, Error> {
    let i = this.offset

    while (i < this.bytes.length && this.bytes[i] > 0)
      i++

    if (i === this.bytes.length)
      return Err.error(`Out of bounds NULL`)

    return new Ok(i)
  }

  /**
   * Get a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  getNulled(): Result<Bytes, Error> {
    const index = this.null

    if (index.isErr())
      return index

    return this.get(index.inner)
  }

  /**
   * Read a NULL-terminated subarray
   * @returns subarray of the bytes
   */
  readNulled(): Result<Bytes, Error> {
    const index = this.null

    if (index.isErr())
      return index

    const subarray = this.read(index.inner)

    if (subarray.isOk())
      this.offset += subarray.inner.length

    return subarray
  }

  /**
   * Set a NULL-terminated array
   * @param array array
   */
  setNulled(array: Bytes): Result<void, Error> {
    const start = this.offset
    const result = this.writeNulled(array)
    this.offset = start
    return result
  }

  /**
   * Write a NULL-terminated array
   * @param array array
   */
  writeNulled(array: Bytes): Result<void, Error> {
    const result = this.write(array)

    if (result.isErr())
      return result

    return this.writeUint8(0)
  }

  /**
   * Get a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  getNulledString(encoding?: BufferEncoding): Result<string, Error> {
    const subarray = this.getNulled()

    if (subarray.isErr())
      return subarray

    return new Ok(Buffers.fromView(subarray.inner).toString(encoding))
  }

  /**
   * Read a NULL-terminated string
   * @param encoding encoding
   * @returns string
   */
  readNulledString(encoding?: BufferEncoding): Result<string, Error> {
    const subarray = this.readNulled()

    if (subarray.isErr())
      return subarray

    return new Ok(Buffers.fromView(subarray.inner).toString(encoding))
  }

  /**
   * Set a NULL-terminated string
   * @param text string
   * @param encoding encoding
   */
  setNulledString(text: string, encoding?: BufferEncoding): Result<void, Error> {
    return this.setNulled(Buffer.from(text, encoding))
  }

  /**
   * Write a NULL-terminated string
   * @param text string
   * @param encoding encoding
   */
  writeNulledString(text: string, encoding?: BufferEncoding): Result<void, Error> {
    return this.writeNulled(Buffer.from(text, encoding))
  }

  /**
   * Fill length bytes with value after offset
   * @param value value to fill
   * @param length length to fill
   */
  fill(value: number, length: number): Result<void, Error> {
    try {
      this.bytes.fill(value, this.offset, this.offset + length)
      this.offset += length
      return new Ok<void>(undefined)
    } catch (e: unknown) {
      return Err.error(`Cursor.fill failed`)
    }
  }

  /**
   * Split into chunks of maximum length bytes
   * @param length 
   * @returns 
   */
  *split(length: number): Generator<Bytes, Result<void, Error>> {
    while (this.remaining >= length) {
      const subarray = this.read(length)

      if (subarray.isErr())
        return subarray

      yield subarray.inner
    }

    if (this.remaining) {
      const subarray = this.read(this.remaining)

      if (subarray.isErr())
        return subarray

      yield subarray.inner
    }

    return new Ok<void>(undefined)
  }

}