import { IOwnershipPointer, IHash } from '@src/traits'
import { isFunction } from '@blackglory/prelude'

export function isOwnershiptPointer(view: object): view is IOwnershipPointer {
  return 'freePointed' in view
      && isFunction(view.freePointed)
}

export function isHashable(view: object): view is IHash {
  return 'hash' in view
      && isFunction(view.hash)
}

export function getSlice(
  view: ArrayBufferLike
, byteOffset: number
, byteLength: number
): ArrayBuffer {
  return view.slice(byteOffset, byteOffset + byteLength)
}
