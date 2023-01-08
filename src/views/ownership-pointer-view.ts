import { IAllocator, IHash, IReference, IReadableWritable, IFree, IOwnershipPointer } from '@src/types'
import { PointerView } from '@views/pointer-view'
import { BaseView } from '@views/base-view'

/**
 * OwnershipPointerView与PointerView的区别:
 * 除了语义上的区别以外, 调用OwnershipPointer的free方法调用还会一并销毁它指向的数据.
 */
export class OwnershipPointerView<View extends BaseView & IHash & IFree>
extends PointerView<View>
implements IHash
         , IReference
         , IReadableWritable<number | null>
         , IFree
         , IOwnershipPointer {
  override free(allocator: IAllocator): void {
    super.deref()?.free(allocator)

    super.free(allocator)
  }

  freePointed(allocator: IAllocator): void {
    super.deref()?.free(allocator)
  }
}
