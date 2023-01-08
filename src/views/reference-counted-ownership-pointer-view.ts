import { assert } from '@blackglory/prelude'
import { IAllocator, IHash, IHasher, ISized, IReference, IReadableWritable, IFree, IOwnershipPointer } from '@src/types'
import { StructView } from '@views/struct-view'
import { ViewConstructor } from '@views/pointer-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { BaseView } from './base-view'

type PointerViewConstructor<View extends IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

/**
 * ReferenceCountedOwnershipPointerView与OwnershipPointerView的区别:
 * ReferenceCountedOwnershipPointerView附带引用计数.
 */
export class ReferenceCountedOwnershipPointerView<View extends IHash & IFree>
extends BaseView
implements IHash
           , IReference
           , IReadableWritable<{ count: number; value: number | null }>
           , IFree
           , IOwnershipPointer {
  static readonly byteLength = Uint32View.byteLength + OwnershipPointerView.byteLength

  private view: StructView<{
    count: typeof Uint32View
    value: PointerViewConstructor<View>
  }>

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , viewConstruct: ViewConstructor<View>
  ) {
    super()

    class InternalOwnershipPointerView extends OwnershipPointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstruct)
      }
    }

    this.view = new StructView(buffer, byteOffset, {
      count: Uint32View
    , value: InternalOwnershipPointerView
    })
  }

  free(allocator: IAllocator): void {
    this.decrementCount()
    if (this.getCount() === 0) {
      this.deref()?.free(allocator)

      allocator.free(this.byteOffset)
    }
  }

  freePointed(allocator: IAllocator): void {
    this.decrementCount()
    if (this.getCount() === 0) {
      this.deref()?.free(allocator)
    }
  }

  hash(hasher: IHasher): void {
    const view = this.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write([0])
    }
  }

  set(value: { count: number; value: number | null }): void {
    this.view.set(value)
  }

  get(): { count: number; value: number | null } {
    return this.view.get()
  }

  setCount(value: number): void {
    assert(Number.isInteger(value), 'The new count must be an integer')
    assert(value >= 0, 'The new count must be greater than or equal to 0')
    assert(value <= Number.MAX_SAFE_INTEGER, 'The new count must be less than or equal to Number.MAX_SAFE_INTEGER')

    this.view.setByKey('count', value)
  }

  getCount(): number {
    return this.view.getByKey('count')
  }

  incrementCount(value: number = 1): void {
    const newCount = this.getCount() + value
    this.setCount(newCount)
  }

  decrementCount(value: number = 1): void {
    const newCount = this.getCount() - value
    this.setCount(newCount)
  }

  setValue(value: number | null): void {
    this.view.setByKey('value', value)
  }

  getValue(): number | null {
    return this.view.getByKey('value')
  }

  deref(): View | null {
    const valueView = this.view.getViewByKey('value')
    return valueView.deref()
  }
}
