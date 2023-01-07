export function getSlice(
  view: ArrayBufferLike
, byteOffset: number
, byteLength: number
): ArrayBuffer {
  return view.slice(byteOffset, byteOffset + byteLength)
}
