export * from "./errors/index.js"

import { Slice } from "@hazae41/uncopy"
import { Buffers } from "libs/buffers/buffers.js"
import { Bytes, Uint8Array } from "libs/bytes/index.js"
import { Data } from "libs/dataviews/dataviews.js"
import { Utf8 } from "libs/utf8/utf8.js"
import { CursorReadLengthOverflowError, CursorReadNullOverflowError, CursorWriteLengthOverflowError, CursorWriteUnknownError } from "./errors/index.js"

export class Cursor {

  readonly #data: DataView

  readonly #bytes: Uint8Array

  readonly #buffer: Buffer

  offset: number

  /**
   * A cursor for bytes
   * @param inner 
   * @param offset 
   */
  constructor(buffer: ArrayBufferView, offset = 0) {
    this.offset = offset

    this.#data = Data.fromView(buffer)
    this.#bytes = Bytes.fromView(buffer)
    this.#buffer = Buffers.fromView(buffer)
  }

  static create<T extends Uint8Array>(buffer: T, offset?: number) {
    return new Cursor(buffer, offset)
  }

  /**
   * get bytes
   */
  get bytes() {
    return this.#bytes
  }

  /**
   * @returns total number of bytes
   */
  get length() {
    return this.#bytes.length
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
    return this.#bytes.subarray(0, this.offset)
  }

  /**
   * Get a subarray of the bytes after the current offset
   * @returns subarray of the bytes after the current offset
   */
  get after(): Uint8Array {
    return this.#bytes.subarray(this.offset)
  }

  /**
   * Get a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  getOrThrow<N extends number>(length: N): Slice<N> {
    if (this.remaining < length)
      throw CursorReadLengthOverflowError.from(this, length)

    const subarray = this.#bytes.subarray(this.offset, this.offset + length)

    return new Slice(subarray as Uint8Array<N>)
  }

  /**
   * Read a subarray of the bytes
   * @param length 
   * @returns subarray of the bytes
   */
  readOrThrow<N extends number>(length: N): Slice<N> {
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
    if (littleEndian)
      return this.#buffer.readUIntLE(this.offset, 3)
    else
      return this.#buffer.readUIntBE(this.offset, 3)
  }

  readUint24OrThrow(littleEndian?: boolean): number {
    const x = this.getUint24OrThrow(littleEndian)
    this.offset += 3
    return x
  }

  setUint24OrThrow(x: number, littleEndian?: boolean): void {
    if (littleEndian)
      this.#buffer.writeUIntLE(x, this.offset, 3)
    else
      this.#buffer.writeUIntBE(x, this.offset, 3)
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
    return Utf8.decoder.decode(this.getOrThrow(length).bytes)
  }

  readUtf8OrThrow(length: number): string {
    return Utf8.decoder.decode(this.readOrThrow(length).bytes)
  }

  setUtf8OrThrow(text: string): void {
    const result = Utf8.encoder.encodeInto(text, this.after)

    if (result.read! !== text.length)
      throw new CursorWriteUnknownError()
    return
  }

  writeUtf8OrThrow(text: string): void {
    const result = Utf8.encoder.encodeInto(text, this.after)

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

  getNulledOrThrow(): Slice {
    return this.getOrThrow(this.getNullOrThrow())
  }

  readNulledOrThrow(): Slice {
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

  getNulledStringOrThrow(encoding?: BufferEncoding): string {
    return Buffers.fromView(this.getNulledOrThrow().bytes).toString(encoding)
  }

  readNulledStringOrThrow(encoding?: BufferEncoding): string {
    return Buffers.fromView(this.readNulledOrThrow().bytes).toString(encoding)
  }

  setNulledStringOrThrow(text: string, encoding?: BufferEncoding): void {
    this.setNulledOrThrow(Buffer.from(text, encoding))
  }

  writeNulledStringOrThrow(text: string, encoding?: BufferEncoding): void {
    this.writeNulledOrThrow(Buffer.from(text, encoding))
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

  *splitOrThrow(length: number): Generator<Slice, void> {
    while (this.remaining >= length)
      yield this.readOrThrow(length)

    if (this.remaining)
      yield this.readOrThrow(this.remaining)

    return
  }

}