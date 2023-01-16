import { ISized, IHash, IReadableWritable, IReference, IFree } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { TupleView, MapStructureToTupleValue } from '@views/tuple-view'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { uint32, Uint32Literal } from '@literals/uint32-literal'
import { assert } from '@blackglory/prelude'
import { HashBucketsView } from '@views/hash-buckets-view'
import { UnpackedReadableWritable } from '@src/types'
import { Hasher } from '@src/hasher'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

enum TupleKey {
  Size
, Buckets
}

type IInternalBucketsOwnershipPointerView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<HashBucketsView<View>>

const createInternalViews = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(
  viewConstructor: ViewConstructor<View>
, capacity: number
): {
  InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
} => {
  const structure = lazyStatic(() => {
    return [Uint32View, viewConstructor] satisfies [
      hash: typeof Uint32View
    , value: ViewConstructor<View>
    ]
  }, [viewConstructor])

  return lazyStatic((): {
    InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
  } => {
    class InternalHashBuckestView extends HashBucketsView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor, capacity)
      }
    }

    class InternalBucketsOwnershipPointerView
    extends OwnershipPointerView<InternalHashBuckestView>
    implements IInternalBucketsOwnershipPointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalHashBuckestView)
      }
    }

    return { InternalBucketsOwnershipPointerView }
  }, [structure, capacity])
})

type HashSetStructure<View extends BaseView & IReadableWritable<unknown> & IHash> = [
  size: typeof Uint32View
, buckets: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
]

/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashSetView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IReference
         , IFree {
  static byteLength: number = TupleView.getByteLength([
    Uint32View
  , OwnershipPointerView
  ])

  _view: TupleView<HashSetStructure<View>>
  readonly loadFactor: number
  readonly growthFactor: number

  get capacity(): number {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    return buckets.capacity
  }

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<View>
  , { capacity, growthFactor, loadFactor }: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ) {
    super()

    this.loadFactor = loadFactor
    this.growthFactor = growthFactor

    const { InternalBucketsOwnershipPointerView } = createInternalViews(
      viewConstructor
    , capacity
    )

    const rootView = new TupleView(
      buffer
    , byteOffset
    , [Uint32View, InternalBucketsOwnershipPointerView]
    )
    this._view = rootView
  }

  free(allocator: IAllocator): void {
    this._view.free(allocator)
  }

  set(value: MapStructureToTupleValue<HashSetStructure<View>>): void {
    this._view.set(value)
  }

  get(): MapStructureToTupleValue<HashSetStructure<View>> {
    return this._view.get()
  }

  setSize(value: Uint32Literal): void {
    this._view.setByIndex(TupleKey.Size, value)
  }

  getSize(): number {
    return this._view.getByIndex(TupleKey.Size).get()
  }

  setBuckets(value: Uint32Literal): void {
    return this._view.setByIndex(TupleKey.Buckets, value)
  }

  derefBuckets(): HashBucketsView<View> | null {
    return this._view.getViewByIndex(TupleKey.Buckets).deref()
  }

  itemValues(): IterableIterator<View> {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    return buckets.itemValues()
  }

  hasItem(value: IHash): boolean {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    const hash = this.getItemHash(value)
    return buckets.hasItem(hash)
  }

  addItem(allocator: IAllocator, value: UnpackedReadableWritable<View> & IHash): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    const hash = this.getItemHash(value)
    if (buckets.addItem(allocator, hash, value)) {
      const size = this.incrementSize()
      this.resizeBucketsWhenOverloaded(allocator, size)
    }
  }

  deleteItem(allocator: IAllocator, value: IHash): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    const hash = this.getItemHash(value)
    if (buckets.deleteItem(allocator, hash)) {
      this.decrementSize()
    }
  }

  private getItemHash(value: IHash): number {
    const hasher = new Hasher()
    value.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private resizeBucketsWhenOverloaded(allocator: IAllocator, size: number): void {
    const oldCapacity = this.capacity
    if (this.isOverloaded(size, oldCapacity, this.loadFactor)) {
      let newCapacity = oldCapacity * this.growthFactor
      while (this.isOverloaded(size, newCapacity, this.loadFactor)) {
        newCapacity *= this.growthFactor
      }

      this.resizeBuckets(allocator, newCapacity)
    }
  }

  private isOverloaded(size: number, capacity: number, loadFactor: number): boolean {
    return size / capacity > loadFactor
  }

  private resizeBuckets(allocator: IAllocator, newCapacity: number): void {
    const oldBuckets = this.derefBuckets()
    assert(oldBuckets, 'buckets does not exist')

    if (oldBuckets.capacity !== newCapacity) {
      const { InternalBucketsOwnershipPointerView } = createInternalViews(
        this.viewConstructor
      , newCapacity
      )

      const newBucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(this.viewConstructor, newCapacity)
      )
      const newBuckets = new HashBucketsView(
        allocator.buffer
      , newBucketsByteOffset
      , this.viewConstructor
      , newCapacity
      )
      // 初始化buckets中的每一个指针, 防止指向错误的位置.
      for (let i = 0; i < newCapacity; i++) {
        newBuckets.setByIndex(i, null)
      }

      oldBuckets.transfer(newBuckets)

      const newTupleView = new TupleView(
        allocator.buffer
      , this._view.byteOffset
      , [
          Uint32View
        , InternalBucketsOwnershipPointerView
        ]
      )
      newTupleView.setByIndex(TupleKey.Buckets, uint32(newBucketsByteOffset))

      this._view = newTupleView
      oldBuckets.free(allocator)
    }
  }

  private incrementSize(): number {
    const sizeView = this._view.getViewByIndex(TupleKey.Size)
    const size = sizeView.get().get()
    const newSize = size + 1
    sizeView.set(uint32(newSize))
    return newSize
  }

  private decrementSize(): number {
    const sizeView = this._view.getViewByIndex(TupleKey.Size)
    const size = sizeView.get().get()
    const newSize = size - 1
    sizeView.set(uint32(newSize))
    return newSize
  }
}
