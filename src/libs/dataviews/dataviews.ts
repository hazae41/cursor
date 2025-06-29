export namespace Data {

  export function fromView(view: ArrayBufferView) {
    return new DataView(view.buffer, view.byteOffset, view.byteLength)
  }

}