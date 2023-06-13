import { Cursor } from "./cursor.js"

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
  readonly name = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number,
    readonly bytesLength: number
  ) {
    super(`Overflow reading ${bytesLength} bytes at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor, bytesLength: number) {
    return new CursorReadLengthOverflowError(cursor.offset, cursor.length, bytesLength)
  }

}

export class CursorWriteLengthOverflowError extends Error {
  readonly #class = CursorWriteLengthOverflowError
  readonly name = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number,
    readonly bytesLength: number
  ) {
    super(`Overflow writing ${bytesLength} bytes at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor, bytesLength: number) {
    return new CursorWriteLengthOverflowError(cursor.offset, cursor.length, bytesLength)
  }

}

export class CursorReadNullOverflowError extends Error {
  readonly #class = CursorReadNullOverflowError
  readonly name = this.#class.name

  constructor(
    readonly cursorOffset: number,
    readonly cursorLength: number
  ) {
    super(`Overflow reading null byte at offset ${cursorOffset}/${cursorLength}`)
  }

  static from(cursor: Cursor) {
    return new CursorReadNullOverflowError(cursor.offset, cursor.length)
  }

}

export class CursorReadUnknownError extends Error {
  readonly #class = CursorReadUnknownError
  readonly name = this.#class.name
}

export class CursorWriteUnknownError extends Error {
  readonly #class = CursorWriteUnknownError
  readonly name = this.#class.name
}