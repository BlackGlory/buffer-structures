import { IAllocator, IHash, IHasher, IReference, IReadableWritable, IFree } from '@src/types'
import { isntNull } from '@blackglory/prelude'
import { BaseView } from '@views/base-view'

export type ViewConstructor<View extends BaseView> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

export class PointerView<View extends BaseView & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number | null>
         , IFree {
  static readonly byteLength = Uint32Array.BYTES_PER_ELEMENT

  protected view: DataView

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstruct: ViewConstructor<View>
  ) {
    super()

    this.view = new DataView(buffer)
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset, PointerView.byteLength)
  }

  hash(hasher: IHasher): void {
    const view = this.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write([0])
    }
  }

  set(value: number | null): void {
    this.view.setUint32(this.byteOffset, value ?? 0)
  }

  get(): number | null {
    const pointer = this.view.getUint32(this.byteOffset)
    return pointer === 0
         ? null
         : pointer
  }

  deref(): View | null {
    const value = this.get()
    return isntNull(value)
         ? new this.viewConstruct(this.view.buffer, value)
         : null
  }
}
