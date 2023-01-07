import { IOwnershipPointer } from '@src/types'
import { isFunction } from '@blackglory/prelude'

export function isOwnershiptPointer(view: object): view is IOwnershipPointer {
  return 'freePointed' in view
      && isFunction(view.freePointed)
}
