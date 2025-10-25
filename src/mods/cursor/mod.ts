import { Bytes } from "@/libs/bytes/mod.ts"
import { Data } from "@/libs/dataviews/mod.ts"
import type { Lengthed } from "@/libs/lengthed/mod.ts"

export type CursorError =
  | CursorReadError
  | CursorWriteError

export type CursorReadError =
  | CursorReadOverflowError
  | CursorReadUnknownError

export type CursorReadOverflowError =
  | CursorReadLengthOverflowError
  | CursorReadNullOverflowError

export type CursorWriteError =
  | CursorWriteLengthOverflowError
  | CursorWriteUnknownError

export class CursorReadLengthOverflowError extends Error {
  readonly #class = CursorReadLengthOverflowError
  readonly name: string = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number,
    readonly bytesLength: number
  ) {
    super(`Overflow reading ${bytesLength} bytes at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor, bytesLength: number): CursorReadLengthOverflowError {
    return new CursorReadLengthOverflowError(cursor.offset, cursor.length, bytesLength)
  }

}

export class CursorWriteLengthOverflowError extends Error {
  readonly #class = CursorWriteLengthOverflowError
  readonly name: string = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number,
    readonly bytesLength: number
  ) {
    super(`Overflow writing ${bytesLength} bytes at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor, bytesLength: number): CursorWriteLengthOverflowError {
    return new CursorWriteLengthOverflowError(cursor.offset, cursor.length, bytesLength)
  }

}

export class CursorReadNullOverflowError extends Error {
  readonly #class = CursorReadNullOverflowError
  readonly name: string = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number
  ) {
    super(`Overflow reading null byte at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor): CursorReadNullOverflowError {
    return new CursorReadNullOverflowError(cursor.offset, cursor.length)
  }

}

export class CursorReadUnknownError extends Error {
  readonly #class = CursorReadUnknownError
  readonly name: string = this.#class.name
}

export class CursorWriteUnknownError extends Error {
  readonly #class = CursorWriteUnknownError
  readonly name: string = this.#class.name
}

export class Cursor<T extends ArrayBufferLike = ArrayBufferLike> {

  readonly #data: DataView<T>

  readonly #bytes: Uint8Array<T>

  offset: number

  /**
   * A cursor for bytes
   * @param inner 
   * @param offset 
   */
  constructor(view: Uint8Array<T>, offset = 0) {
    this.offset = offset

    this.#data = Data.fromView(view)
    this.#bytes = Bytes.fromView(view)
  }

  /**
   * get bytes
   */
  get bytes(): Uint8Array<T> {
    return this.#bytes
  }

  /**
   * @returns total number of bytes
   */
  get length(): number {
    return this.#bytes.length
  }

  /**
   * @returns number of remaining bytes
   */
  get remaining(): number {
    return this.length - this.offset
  }

  /**
   * Get a subarray of the bytes before the current offset
   * @returns subarray of the bytes before the current offset
   */
  get before(): Uint8Array<T> {
    return this.#bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after(): Uint8Array<T> {
    return this.#bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  getOrThrow<N extends number>(length: N): Uint8Array<T> & Lengthed<N> {
    if (this.remaining < length)
      throw CursorReadLengthOverflowError.from(this, length)

    const subarray = this.#bytes.subarray(this.offset, this.offset + length)

    return subarray as Uint8Array<T> & Lengthed<N>
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  readOrThrow<N extends number>(length: N): Uint8Array<T> & Lengthed<N> {
    const subarray = this.getOrThrow(length)
    this.offset += length
    return subarray
  }

  /**
   * Set an array to the bytes
   * @param array array
   */
  setOrThrow(array: Uint8Array): void {
    if (this.remaining < array.length)
      throw CursorWriteLengthOverflowError.from(this, array.length)

    this.#bytes.set(array, this.offset)
  }

  /**
   * Write an array to the bytes
   * @param array array
   */
  writeOrThrow(array: Uint8Array): void {
    this.setOrThrow(array)
    this.offset += array.length
  }

  getUint8OrThrow(): number {
    return this.#bytes[this.offset]
  }

  readUint8OrThrow(): number {
    const x = this.getUint8OrThrow()
    this.offset++
    return x
  }

  setUint8OrThrow(x: number): void {
    this.#bytes[this.offset] = x
  }

  writeUint8OrThrow(x: number): void {
    this.setUint8OrThrow(x)
    this.offset++
  }

  getUint16OrThrow(littleEndian?: boolean): number {
    return this.#data.getUint16(this.offset, littleEndian)
  }

  readUint16OrThrow(littleEndian?: boolean): number {
    const x = this.getUint16OrThrow(littleEndian)
    this.offset += 2
    return x
  }

  setUint16OrThrow(x: number, littleEndian?: boolean): void {
    this.#data.setUint16(this.offset, x, littleEndian)
  }

  writeUint16OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint16OrThrow(x, littleEndian)
    this.offset += 2
  }

  getUint24OrThrow(littleEndian?: boolean): number {
    if (littleEndian) {
      return (this.#bytes[this.offset]) | (this.#bytes[this.offset + 1] << 8) | (this.#bytes[this.offset + 2] << 16)
    } else {
      return (this.#bytes[this.offset] << 16) | (this.#bytes[this.offset + 1] << 8) | (this.#bytes[this.offset + 2])
    }
  }

  readUint24OrThrow(littleEndian?: boolean): number {
    const x = this.getUint24OrThrow(littleEndian)
    this.offset += 3
    return x
  }

  setUint24OrThrow(x: number, littleEndian?: boolean): void {
    if (littleEndian) {
      this.#bytes[this.offset] = x & 0xFF
      this.#bytes[this.offset + 1] = (x >> 8) & 0xFF
      this.#bytes[this.offset + 2] = (x >> 16) & 0xFF
    } else {
      this.#bytes[this.offset] = (x >> 16) & 0xFF
      this.#bytes[this.offset + 1] = (x >> 8) & 0xFF
      this.#bytes[this.offset + 2] = x & 0xFF
    }
  }

  writeUint24OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint24OrThrow(x, littleEndian)
    this.offset += 3
  }

  getUint32OrThrow(littleEndian?: boolean): number {
    return this.#data.getUint32(this.offset, littleEndian)
  }

  readUint32OrThrow(littleEndian?: boolean): number {
    const x = this.getUint32OrThrow(littleEndian)
    this.offset += 4
    return x
  }

  setUint32OrThrow(x: number, littleEndian?: boolean): void {
    this.#data.setUint32(this.offset, x, littleEndian)
  }

  writeUint32OrThrow(x: number, littleEndian?: boolean): void {
    this.setUint32OrThrow(x, littleEndian)
    this.offset += 4
  }

  getUint64OrThrow(littleEndian?: boolean): bigint {
    return this.#data.getBigUint64(this.offset, littleEndian)
  }

  readUint64OrThrow(littleEndian?: boolean): bigint {
    const x = this.getUint64OrThrow(littleEndian)
    this.offset += 8
    return x
  }

  setUint64OrThrow(x: bigint, littleEndian?: boolean): void {
    this.#data.setBigUint64(this.offset, x, littleEndian)
  }

  writeUint64OrThrow(x: bigint, littleEndian?: boolean): void {
    this.setUint64OrThrow(x, littleEndian)
    this.offset += 8
  }

  getUtf8OrThrow(length: number): string {
    return new TextDecoder().decode(this.getOrThrow(length))
  }

  readUtf8OrThrow(length: number): string {
    return new TextDecoder().decode(this.readOrThrow(length))
  }

  setUtf8OrThrow(text: string): void {
    const result = new TextEncoder().encodeInto(text, this.after)

    if (result.read! !== text.length)
      throw new CursorWriteUnknownError()
    return
  }

  writeUtf8OrThrow(text: string): void {
    const result = new TextEncoder().encodeInto(text, this.after)

    if (result.read! !== text.length)
      throw new CursorWriteUnknownError()

    this.offset += result.written!
  }

  getNullOrThrow(): number {
    let i = this.offset

    while (i < this.#bytes.length && this.#bytes[i] > 0)
      i++

    if (i === this.#bytes.length)
      throw CursorReadNullOverflowError.from(this)

    return i
  }

  getNulledOrThrow(): Uint8Array<T> {
    return this.getOrThrow(this.getNullOrThrow())
  }

  readNulledOrThrow(): Uint8Array<T> {
    return this.readOrThrow(this.getNullOrThrow())
  }

  setNulledOrThrow(array: Uint8Array): void {
    const start = this.offset

    try {
      this.writeNulledOrThrow(array)
    } finally {
      this.offset = start
    }
  }

  writeNulledOrThrow(array: Uint8Array): void {
    this.writeOrThrow(array)
    this.writeUint8OrThrow(0)
  }

  /**
   * Fill length bytes with value after offset
   * @param value value to fill
   * @param length length to fill
   */
  fillOrThrow(value: number, length: number): void {
    if (this.remaining < length)
      throw CursorWriteLengthOverflowError.from(this, length)

    this.#bytes.fill(value, this.offset, this.offset + length)
    this.offset += length
  }

  *splitOrThrow(length: number): Generator<Uint8Array<T>, void> {
    while (this.remaining >= length)
      yield this.readOrThrow(length)

    if (this.remaining)
      yield this.readOrThrow(this.remaining)

    return
  }

}