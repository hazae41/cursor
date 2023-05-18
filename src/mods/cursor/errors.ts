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

  constructor(
    readonly cursor: Cursor,
    readonly length: number
  ) {
    super(`Overflow reading ${length} bytes at offset ${cursor.offset}/${cursor.length}`)
  }
}

export class CursorWriteLengthOverflowError extends Error {
  readonly #class = CursorWriteLengthOverflowError

  constructor(
    readonly cursor: Cursor,
    readonly length: number
  ) {
    super(`Overflow writing ${length} bytes at offset ${cursor.offset}/${cursor.length}`)
  }
}

export class CursorReadNullOverflowError extends Error {
  readonly #class = CursorReadNullOverflowError

  constructor(
    readonly cursor: Cursor
  ) {
    super(`Overflow reading null byte at offset ${cursor.offset}/${cursor.length}`)
  }
}

export class CursorReadUnknownError extends Error {
  readonly #class = CursorReadUnknownError

  constructor(
    readonly cursor: Cursor,
    readonly message: string,
    readonly options?: ErrorOptions
  ) {
    super(message, options)
  }
}

export class CursorWriteUnknownError extends Error {
  readonly #class = CursorWriteUnknownError

  constructor(
    readonly cursor: Cursor,
    readonly message: string,
    readonly options?: ErrorOptions
  ) {
    super(message, options)
  }
}