import { IHash, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { isntNull } from '@blackglory/prelude'
import { BaseView } from '@views/base-view.js'
import { NULL } from '@src/null.js'
import { uint32, Uint32Literal } from '@literals/uint32-literal.js'

export type ViewConstructor<View extends BaseView> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

export class PointerView<View extends BaseView & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<Uint32Literal | null>
         , IFree {
  static readonly byteLength: number = Uint32Array.BYTES_PER_ELEMENT

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
      hasher.write(NULL)
    }
  }

  set(value: Uint32Literal | null): void {
    this.view.setUint32(this.byteOffset, value?.get() ?? 0)
  }

  get(): Uint32Literal | null {
    const pointer = this.view.getUint32(this.byteOffset)
    return pointer === 0
         ? null
         : uint32(pointer)
  }

  deref(): View | null {
    const value = this.get()
    return isntNull(value)
         ? new this.viewConstruct(this.view.buffer, value.get())
         : null
  }
}
