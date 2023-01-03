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

export function uint8ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint8(0, value)

  const result: number[] = []
  for (let i = 0; i < Uint8Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function uint16ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Uint16Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setUint16(0, value)

  const result: number[] = []
  for (let i = 0; i < Uint16Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
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

export function float64ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setFloat64(0, value)

  const result: number[] = []
  for (let i = 0; i < Float64Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function float32ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setFloat32(0, value)

  const result: number[] = []
  for (let i = 0; i < Float32Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function int8ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Int8Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt8(0, value)

  const result: number[] = []
  for (let i = 0; i < Int8Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function int16ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Int16Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt16(0, value)

  const result: number[] = []
  for (let i = 0; i < Int16Array.BYTES_PER_ELEMENT; i++) {
    result[i] = view.getUint8(i)
  }
  return result
}

export function int32ToBytes(value: number): number[] {
  const buffer = new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setInt32(0, value)

  const result: number[] = []
  for (let i = 0; i < Int32Array.BYTES_PER_ELEMENT; i++) {
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
