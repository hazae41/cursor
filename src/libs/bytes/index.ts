export namespace Bytes {

  export function fromView(view: ArrayBufferView): Uint8Array {
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }

}