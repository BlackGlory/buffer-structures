import { assert, isntNull, isPositiveInfinity } from '@blackglory/prelude'
import { IHash, IHasher, ISized, IReference, IReadableWritable } from '@src/types'
import { StructView } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'
import { Uint32View } from '@views/uint32-view'

export type ViewConstructor<View> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

export type PointerViewConstructor<View extends IHash> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export class ReferenceCountedView<
  View extends IHash
> implements IHash
           , IReference
           , IReadableWritable<{ count: number; value: number | null }> {
  static readonly byteLength = Uint32Array.BYTES_PER_ELEMENT + PointerView.byteLength

  private view: StructView<{
    count: typeof Uint32View
    value: PointerViewConstructor<View>
  }>

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstruct: ViewConstructor<View>
  ) {
    class InternalView extends PointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstruct)
      }
    }

    this.view = new StructView(buffer, byteOffset, {
      count: Uint32View
    , value: InternalView
    })
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
    const value = this.view.getByKey('value')

    return isntNull(value)
         ? new this.viewConstruct(this.buffer, value)
         : null
  }
}
