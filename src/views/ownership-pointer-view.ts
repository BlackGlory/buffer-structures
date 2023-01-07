import { IAllocator, IHash, IHasher, ISized, IReference, IReadableWritable, IFree } from '@src/types'
import { PointerView, ViewConstructor } from '@views/pointer-view'

export type PointerViewConstructor<View extends IHash> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

/**
 * OwnershipPointerView与PointerView的区别:
 * 除了语义上的区别以外, 调用OwnershipPointer的free方法调用还会一并销毁它指向的数据.
 */
export class OwnershipPointerView<
  View extends IHash & IFree
> implements IHash
           , IReference
           , IReadableWritable<number | null>
           , IFree {
  static readonly byteLength = PointerView.byteLength

  private view: PointerView<View>

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , viewConstruct: ViewConstructor<View>
  ) {
    this.view = new PointerView(buffer, byteOffset, viewConstruct)
  }

  free(allocator: IAllocator): void {
    this.deref()?.free(allocator)

    this.view.free(allocator)
  }

  hash(hasher: IHasher): void {
    this.view.hash(hasher)
  }

  set(value: number | null): void {
    this.view.set(value)
  }

  get(): number | null {
    return this.view.get()
  }

  deref(): View | null {
    return this.view.deref()
  }
}
