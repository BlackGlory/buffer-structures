import { isntNull } from '@blackglory/prelude'
import { ISized, IReference, IReadable, IWritable } from '@src/types'
import { StructView } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'
import { Uint32View } from '@views/uint32-view'

export type ViewConstructor<View> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

export type PointerViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export class ReferenceCountedView<View> implements IReference
           , IReadable<{ count: number; value: number | null }>
           , IWritable<{ count: number; value: number | null }> {
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

  set(value: { count: number; value: number | null }): void {
    this.view.set(value)
  }

  get(): { count: number; value: number | null } {
    return this.view.get()
  }

  setCount(value: number): void {
    this.view.setByKey('count', value)
  }

  getCount(): number {
    return this.view.getByKey('count')
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
