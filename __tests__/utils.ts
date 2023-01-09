import { toArray } from '@blackglory/prelude'

export function setSlice(view: DataView, byteOffset: number, slice: number[]): void {
  for (let i = 0; i < slice.length; i++) {
    view.setUint8(byteOffset + i, slice[i])
  }
}

export function getSlice(
  view: ArrayBufferLike
, byteOffset: number
, byteLength: number
): ArrayBuffer {
  return view.slice(byteOffset, byteOffset + byteLength)
}

export function bufferToBytes(buffer: ArrayBufferLike): number[] {
  return toArray(new Uint8Array(buffer))
}

export function bytesToBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes)
}

export function uint8ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint8(0, value)

  return buffer
}

export function uint16ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Uint16Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint16(0, value)

  return buffer
}

export function uint32ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint32(0, value)

  return buffer
}

export function float64ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setFloat64(0, value)

  return buffer
}

export function float32ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setFloat32(0, value)

  return buffer
}

export function int8ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Int8Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt8(0, value)

  return buffer
}

export function int16ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Int16Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt16(0, value)

  return buffer
}

export function int32ToBuffer(value: number): ArrayBuffer {
  const buffer = new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt32(0, value)

  return buffer
}
