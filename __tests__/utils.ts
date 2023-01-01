export function setSlice(view: DataView, byteOffset: number, slice: number[]): void {
  for (let i = 0; i < slice.length; i++) {
    view.setUint8(byteOffset + i, slice[i])
  }
}

export function getSlice(view: DataView, byteOffset: number, byteLength: number): number[] {
  const result: number[] = []

  for (let i = 0; i < byteLength; i++) {
    result[i] = view.getUint8(byteOffset + i)
  }

  return result
}

export function uint32ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint32(0, value)

  const result: number[] = []
  for (let i = 0; i < Uint32Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function bufferToBytes(buffer: ArrayBufferLike): number[] {
  const result: number[] = []

  const view = new DataView(buffer)
  for (let i = 0; i < buffer.byteLength; i++) {
    result[i] = view.getUint8(i)
  }

  return result
}
