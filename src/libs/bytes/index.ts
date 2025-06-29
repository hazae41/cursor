export type Uint8Array<N extends number = number> = number extends N
  ? globalThis.Uint8Array
  : globalThis.Uint8Array & { readonly length: N }

export namespace Bytes {

  export function fromView(view: ArrayBufferView): Uint8Array {
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }

}