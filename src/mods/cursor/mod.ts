import { Data } from "@/libs/dataviews/mod.ts";

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

  readonly data: DataView<T>

  offset = 0

  /**
   * A cursor for bytes
   * @param inner 
   * @param offset 
   */
  constructor(
    readonly bytes: Uint8Array<T>
  ) {
    this.data = Data.fromView(bytes)
  }

  /**
   * @returns total number of bytes
   */
  get length(): number {
    return this.bytes.length
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
    return this.bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after(): Uint8Array<T> {
    return this.bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  get(length: number): Uint8Array<T> {
    if (this.remaining < length)
      throw CursorReadLengthOverflowError.from(this, length)

    return this.bytes.subarray(this.offset, this.offset + length)
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  read(length: number): Uint8Array<T> {
    const subarray = this.get(length)

    this.offset += length

    return subarray
  }

  /**
   * Set an array to the bytes
   * @param array array
   */
  set(array: Uint8Array): void {
    if (this.remaining < array.length)
      throw CursorWriteLengthOverflowError.from(this, array.length)

    this.bytes.set(array, this.offset)
  }

  /**
   * Write an array to the bytes
   * @param array array
   */
  write(array: Uint8Array): void {
    this.set(array)

    this.offset += array.length
  }

  getUint8(): number {
    return this.data.getUint8(this.offset)
  }

  readUint8(): number {
    const x = this.getUint8()

    this.offset++

    return x
  }

  setUint8(x: number): void {
    this.data.setUint8(this.offset, x)
  }

  writeUint8(x: number): void {
    this.setUint8(x)

    this.offset++
  }

  getInt8(): number {
    return this.data.getInt8(this.offset)
  }

  readInt8(): number {
    const x = this.getInt8()

    this.offset++

    return x
  }

  setInt8(x: number): void {
    this.data.setInt8(this.offset, x)
  }

  writeInt8(x: number): void {
    this.setInt8(x)

    this.offset++
  }

  getUint16(littleEndian?: boolean): number {
    return this.data.getUint16(this.offset, littleEndian)
  }

  readUint16(littleEndian?: boolean): number {
    const x = this.getUint16(littleEndian)

    this.offset += 2

    return x
  }

  setUint16(x: number, littleEndian?: boolean): void {
    this.data.setUint16(this.offset, x, littleEndian)
  }

  writeUint16(x: number, littleEndian?: boolean): void {
    this.setUint16(x, littleEndian)

    this.offset += 2
  }

  getInt16(littleEndian?: boolean): number {
    return this.data.getInt16(this.offset, littleEndian)
  }

  readInt16(littleEndian?: boolean): number {
    const x = this.getInt16(littleEndian)

    this.offset += 2

    return x
  }

  setInt16(x: number, littleEndian?: boolean): void {
    this.data.setInt16(this.offset, x, littleEndian)
  }

  writeInt16(x: number, littleEndian?: boolean): void {
    this.setInt16(x, littleEndian)

    this.offset += 2
  }

  getUint24(littleEndian?: boolean): number {
    if (littleEndian) {
      return (this.bytes[this.offset]) | (this.bytes[this.offset + 1] << 8) | (this.bytes[this.offset + 2] << 16)
    } else {
      return (this.bytes[this.offset] << 16) | (this.bytes[this.offset + 1] << 8) | (this.bytes[this.offset + 2])
    }
  }

  readUint24(littleEndian?: boolean): number {
    const x = this.getUint24(littleEndian)

    this.offset += 3

    return x
  }

  setUint24(x: number, littleEndian?: boolean): void {
    if (littleEndian) {
      this.bytes[this.offset] = x & 0xFF
      this.bytes[this.offset + 1] = (x >> 8) & 0xFF
      this.bytes[this.offset + 2] = (x >> 16) & 0xFF
    } else {
      this.bytes[this.offset] = (x >> 16) & 0xFF
      this.bytes[this.offset + 1] = (x >> 8) & 0xFF
      this.bytes[this.offset + 2] = x & 0xFF
    }
  }

  writeUint24(x: number, littleEndian?: boolean): void {
    this.setUint24(x, littleEndian)

    this.offset += 3
  }

  getUint32(littleEndian?: boolean): number {
    return this.data.getUint32(this.offset, littleEndian)
  }

  readUint32(littleEndian?: boolean): number {
    const x = this.getUint32(littleEndian)

    this.offset += 4

    return x
  }

  setUint32(x: number, littleEndian?: boolean): void {
    this.data.setUint32(this.offset, x, littleEndian)
  }

  writeUint32(x: number, littleEndian?: boolean): void {
    this.setUint32(x, littleEndian)

    this.offset += 4
  }

  getInt32(littleEndian?: boolean): number {
    return this.data.getInt32(this.offset, littleEndian)
  }

  readInt32(littleEndian?: boolean): number {
    const x = this.getInt32(littleEndian)

    this.offset += 4

    return x
  }

  setInt32(x: number, littleEndian?: boolean): void {
    this.data.setInt32(this.offset, x, littleEndian)
  }

  writeInt32(x: number, littleEndian?: boolean): void {
    this.setInt32(x, littleEndian)

    this.offset += 4
  }

  getBigUint64(littleEndian?: boolean): bigint {
    return this.data.getBigUint64(this.offset, littleEndian)
  }

  readBigUint64(littleEndian?: boolean): bigint {
    const x = this.getBigUint64(littleEndian)

    this.offset += 8

    return x
  }

  setBigUint64(x: bigint, littleEndian?: boolean): void {
    this.data.setBigUint64(this.offset, x, littleEndian)
  }

  writeBigUint64(x: bigint, littleEndian?: boolean): void {
    this.setBigUint64(x, littleEndian)

    this.offset += 8
  }

  getBigInt64(littleEndian?: boolean): bigint {
    return this.data.getBigInt64(this.offset, littleEndian)
  }

  readBigInt64(littleEndian?: boolean): bigint {
    const x = this.getBigInt64(littleEndian)

    this.offset += 8

    return x
  }

  setBigInt64(x: bigint, littleEndian?: boolean): void {
    this.data.setBigInt64(this.offset, x, littleEndian)
  }

  writeBigInt64(x: bigint, littleEndian?: boolean): void {
    this.setBigInt64(x, littleEndian)

    this.offset += 8
  }

  getFloat16(littleEndian?: boolean): number {
    return this.data.getFloat16(this.offset, littleEndian)
  }

  readFloat16(littleEndian?: boolean): number {
    const x = this.getFloat16(littleEndian)

    this.offset += 2

    return x
  }

  setFloat16(x: number, littleEndian?: boolean): void {
    this.data.setFloat16(this.offset, x, littleEndian)
  }

  writeFloat16(x: number, littleEndian?: boolean): void {
    this.setFloat16(x, littleEndian)

    this.offset += 2
  }

  getFloat32(littleEndian?: boolean): number {
    return this.data.getFloat32(this.offset, littleEndian)
  }

  readFloat32(littleEndian?: boolean): number {
    const x = this.getFloat32(littleEndian)

    this.offset += 4

    return x
  }

  setFloat32(x: number, littleEndian?: boolean): void {
    this.data.setFloat32(this.offset, x, littleEndian)
  }

  writeFloat32(x: number, littleEndian?: boolean): void {
    this.setFloat32(x, littleEndian)

    this.offset += 4
  }

  getFloat64(littleEndian?: boolean): number {
    return this.data.getFloat64(this.offset, littleEndian)
  }

  readFloat64(littleEndian?: boolean): number {
    const x = this.getFloat64(littleEndian)

    this.offset += 8

    return x
  }

  setFloat64(x: number, littleEndian?: boolean): void {
    this.data.setFloat64(this.offset, x, littleEndian)
  }

  writeFloat64(x: number, littleEndian?: boolean): void {
    this.setFloat64(x, littleEndian)

    this.offset += 8
  }

}