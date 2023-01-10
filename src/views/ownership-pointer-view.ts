import { IHash, IReference, IReadableWritable, IFree, IOwnershipPointer } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { isntNull } from '@blackglory/prelude'
import { BaseView } from '@views/base-view'
import { NULL } from '@utils/null'

export type ViewConstructor<View extends BaseView> = new (
  buffer: ArrayBufferLike
, byteOffset: number
) => View

/**
 * OwnershipPointerView与PointerView的区别:
 * 除了语义上的区别以外, 调用OwnershipPointer的free方法调用还会一并销毁它指向的数据.
 */
export class OwnershipPointerView<View extends BaseView & IHash & IFree>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<number | null>
         , IFree
         , IOwnershipPointer {
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
    this.deref()?.free(allocator)

    allocator.free(this.byteOffset, OwnershipPointerView.byteLength)
  }

  freePointed(allocator: IAllocator): void {
    this.deref()?.free(allocator)
  }

  hash(hasher: IHasher): void {
    const view = this.deref()
    if (view) {
      view.hash(hasher)
    } else {
      hasher.write(NULL)
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
