export function readBytes(
  buffer: ArrayBufferLike
, byteOffset: number
, byteLength: number
): number[] {
  const bytes: number[] = []
  const view = new DataView(buffer, byteOffset, byteLength)

  for (let i = 0; i < view.byteLength; i++) {
    const byte = view.getUint8(i)
    bytes.push(byte)
  }

  return bytes
}
