import { Uint8Array } from "libs/bytes/bytes.js"

export interface Copiable<N extends number = number> {

  get(): Uint8Array<N>

  copy(): Copied<N>

}

export class Copied<N extends number = number> implements Copiable<N> {
  readonly #class = Copied

  private constructor(
    readonly bytes: Uint8Array<N>,
  ) { }

  static from<N extends number>(bytes: Uint8Array<N>): Copied<N> {
    return new Copied(bytes.slice() as Uint8Array<N>)
  }

  get() {
    return this.bytes
  }

  copy() {
    return this
  }

}

export class Uncopied<N extends number = number> implements Copiable<N> {

  constructor(
    readonly bytes: Uint8Array<N>,
  ) { }

  get() {
    return this.bytes
  }

  copy() {
    return Copied.from(this.bytes)
  }

}