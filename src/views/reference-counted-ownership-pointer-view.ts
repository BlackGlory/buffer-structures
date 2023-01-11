import { assert } from '@blackglory/prelude'
import { IHash, ISized, IReference, IReadableWritable, IFree, IOwnershipPointer } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { StructView } from '@views/struct-view'
import { ViewConstructor } from '@views/pointer-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { NULL } from '@utils/null'
import { Uint32Literal, uint32 } from '@literals/uint32-literal'

type OwnershipPointerViewConstructor<View extends BaseView & IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

const createInternalOwnershipPointerView = withLazyStatic(<
  View extends BaseView & IHash & IFree
>(viewConstructor: ViewConstructor<View>) => {
  return lazyStatic(() => {
    class InternalOwnershipPointerView extends OwnershipPointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor)
      }
    }

    return InternalOwnershipPointerView
  }, [viewConstructor])
})

/**
 * ReferenceCountedOwnershipPointerView与OwnershipPointerView的区别:
 * ReferenceCountedOwnershipPointerView附带引用计数.
 */
export class ReferenceCountedOwnershipPointerView<View extends BaseView & IHash & IFree>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<{ count: Uint32Literal; value: Uint32Literal | null }>
         , IFree
         , IOwnershipPointer {
  static readonly byteLength: number = Uint32View.byteLength
                                     + OwnershipPointerView.byteLength

  private view: StructView<{
    count: typeof Uint32View
    value: OwnershipPointerViewConstructor<View>
  }>

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ) {
    super()

    this.view = new StructView(buffer, byteOffset, {
      count: Uint32View
    , value: createInternalOwnershipPointerView(viewConstructor)
    })
  }

  free(allocator: IAllocator): void {
    this.decrementCount()
    if (this.getCount().get() === 0) {
      this.deref()?.free(allocator)

      allocator.free(this.byteOffset, ReferenceCountedOwnershipPointerView.byteLength)
    }
  }

  freePointed(allocator: IAllocator): void {
    this.decrementCount()
    if (this.getCount().get() === 0) {
      this.deref()?.free(allocator)
    }
  }

  hash(hasher: IHasher): void {
    const view = this.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write(NULL)
    }
  }

  set(value: { count: Uint32Literal; value: Uint32Literal | null }): void {
    this.view.set(value)
  }

  get(): { count: Uint32Literal; value: Uint32Literal | null } {
    return this.view.get()
  }

  setCount(value: Uint32Literal): void {
    assert(Number.isInteger(value.get()), 'The new count must be an integer')
    assert(value.get() >= 0, 'The new count must be greater than or equal to 0')
    assert(
      value.get() <= Number.MAX_SAFE_INTEGER
    , 'The new count must be less than or equal to Number.MAX_SAFE_INTEGER'
    )

    this.view.setByKey('count', value)
  }

  getCount(): Uint32Literal {
    return this.view.getByKey('count')
  }

  incrementCount(value: Uint32Literal = uint32(1)): void {
    const newCount = this.getCount().get() + value.get()
    this.setCount(uint32(newCount))
  }

  decrementCount(value: Uint32Literal = uint32(1)): void {
    const newCount = this.getCount().get() - value.get()
    this.setCount(uint32(newCount))
  }

  setValue(value: Uint32Literal | null): void {
    this.view.setByKey('value', value)
  }

  getValue(): Uint32Literal | null {
    return this.view.getByKey('value')
  }

  deref(): View | null {
    const valueView = this.view.getViewByKey('value')
    return valueView.deref()
  }
}
