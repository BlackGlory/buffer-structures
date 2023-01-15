import { IOwnershipPointer } from '@src/traits'
import { isFunction } from '@blackglory/prelude'

export function isOwnershiptPointer(view: object): view is IOwnershipPointer {
  return 'freePointed' in view
      && isFunction(view.freePointed)
}

export function getSlice(
  view: ArrayBufferLike
, byteOffset: number
, byteLength: number
): ArrayBuffer {
  return view.slice(byteOffset, byteOffset + byteLength)
}
