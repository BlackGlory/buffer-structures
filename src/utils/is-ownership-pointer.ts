import { IOwnershipPointer } from '@src/traits'
import { isFunction } from '@blackglory/prelude'

export function isOwnershiptPointer(view: object): view is IOwnershipPointer {
  return 'freePointed' in view
      && isFunction(view.freePointed)
}
