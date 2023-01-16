import { ISized, IHash, IReadableWritable, IReference, IFree } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { MapStructureToTupleValue, TupleView } from '@views/tuple-view'
import { Hasher } from '@src/hasher'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { uint32, Uint32Literal } from '@literals/uint32-literal'
import { map } from 'iterable-operator'
import { assert } from '@blackglory/prelude'
import { HashBucketsView } from '@views/hash-buckets-view'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

enum OuterTupleKey {
  Size
, Buckets
}

enum InnerTupleKey {
  Key
, Value
}

type IInternalTupleView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = TupleView<[
  key: ViewConstructor<KeyView>
, value: ViewConstructor<ValueView>
]>

type IInternalBucketsOwnershipPointerView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<HashBucketsView<IInternalTupleView<KeyView, ValueView>>>

export const createInternalViews = withLazyStatic(<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>(
  keyViewConstructor: ViewConstructor<KeyView>
, valueViewConstructor: ViewConstructor<ValueView>
, capacity: number
): {
  InternalTupleView: ViewConstructor<IInternalTupleView<KeyView, ValueView>>
  InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<KeyView, ValueView>>
} => {
  const structure = lazyStatic(() => {
    return [Uint32View, keyViewConstructor, valueViewConstructor] satisfies [
      hash: typeof Uint32View
    , key: ViewConstructor<KeyView>
    , value: ViewConstructor<ValueView>
    ]
  }, [valueViewConstructor])

  return lazyStatic((): {
    InternalTupleView: ViewConstructor<IInternalTupleView<KeyView, ValueView>>
    InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<KeyView, ValueView>>
  } => {
    class InternalTupleView
    extends TupleView<[
      key: ViewConstructor<KeyView>
    , value: ViewConstructor<ValueView>
    ]>
    implements IInternalTupleView<KeyView, ValueView> {
      static byteLength = TupleView.getByteLength([
        keyViewConstructor
      , valueViewConstructor
      ])

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, [
          keyViewConstructor
        , valueViewConstructor
        ])
      }
    }

    class InternalHashBucketsView extends HashBucketsView<InternalTupleView> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalTupleView, capacity)
      }
    }

    class InternalBucketsOwnershipPointerView
    extends OwnershipPointerView<HashBucketsView<InternalTupleView>>
    implements IInternalBucketsOwnershipPointerView<KeyView, ValueView> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalHashBucketsView)
      }
    }

    return {
      InternalTupleView
    , InternalBucketsOwnershipPointerView
    }
  }, [structure, capacity])
})

type HashMapStructure<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = [
  size: typeof Uint32View
, buckets: ViewConstructor<IInternalBucketsOwnershipPointerView<KeyView, ValueView>>
]

/**
 * 在向HashMap添加新的项目后, HashMap可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashMapView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseView
implements IReference
         , IFree {
  static byteLength = TupleView.getByteLength([
    Uint32View
  , OwnershipPointerView
  ])

  _view: TupleView<HashMapStructure<KeyView, ValueView>>
  public readonly loadFactor: number
  public readonly growthFactor: number
  private InternalTupleView: ViewConstructor<IInternalTupleView<KeyView, ValueView>>

  get capacity(): number {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    return buckets.capacity
  }

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private keyViewConstructor: ViewConstructor<KeyView>
  , private valueViewConstructor: ViewConstructor<ValueView>
  , { capacity, growthFactor, loadFactor }: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  ) {
    super()

    this.loadFactor = loadFactor
    this.growthFactor = growthFactor

    const {
      InternalBucketsOwnershipPointerView
    , InternalTupleView
    } = createInternalViews(
      keyViewConstructor
    , valueViewConstructor
    , capacity
    )
    this.InternalTupleView = InternalTupleView

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

  set(value: MapStructureToTupleValue<HashMapStructure<KeyView, ValueView>>): void {
    this._view.set(value)
  }

  get(): MapStructureToTupleValue<HashMapStructure<KeyView, ValueView>> {
    return this._view.get()
  }

  setSize(value: Uint32Literal): void {
    this._view.setByIndex(OuterTupleKey.Size, value)
  }

  getSize(): number {
    return this._view.getByIndex(OuterTupleKey.Size).get()
  }

  setBuckets(value: Uint32Literal): void {
    return this._view.setByIndex(OuterTupleKey.Buckets, value)
  }

  derefBuckets(): HashBucketsView<IInternalTupleView<KeyView, ValueView>> | null {
    return this._view.getViewByIndex(OuterTupleKey.Buckets).deref()
  }

  itemEntries(): IterableIterator<[KeyView, ValueView]> {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    return map(buckets.itemValues(), view => [
      view.getViewByIndex(InnerTupleKey.Key)
    , view.getViewByIndex(InnerTupleKey.Value)
    ])
  }

  itemKeys(): IterableIterator<KeyView> {
    return map(this.itemEntries(), ([key]) => key)
  }

  itemValues(): IterableIterator<ValueView> {
    return map(this.itemEntries(), ([, value]) => value)
  }

  hasItem(key: IHash): boolean {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getItemHash(key)
    return buckets.hasItem(hash)
  }

  getItem(key: IHash): ValueView | undefined {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getItemHash(key)
    const view = buckets.getItem(hash)
    return view?.getViewByIndex(InnerTupleKey.Value)
  }

  setItem(
    allocator: IAllocator
  , key: UnpackedReadableWritable<KeyView> & IHash
  , value: UnpackedReadableWritable<ValueView>
  ): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getItemHash(key)
    if (buckets.addItem(allocator, hash, [key, value])) {
      const size = this.incrementSize()
      this.resizeBucketsWhenOverloaded(allocator, size)
    }
  }

  deleteItem(allocator: IAllocator, key: IHash): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'The buckets does not exist')

    const hash = this.getItemHash(key)
    if (buckets.deleteItem(allocator, hash)) {
      this.decrementSize()
    }
  }

  private getItemHash(key: IHash): number {
    const hasher = new Hasher()
    key.hash(hasher)
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
      const {
        InternalBucketsOwnershipPointerView
      } = createInternalViews(
        this.keyViewConstructor
      , this.valueViewConstructor
      , newCapacity
      )

      const newBucketsByteOffset = allocator.allocate(
        HashBucketsView.getByteLength(this.InternalTupleView, newCapacity)
      )
      const newBuckets = new HashBucketsView(
        allocator.buffer
      , newBucketsByteOffset
      , this.InternalTupleView
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
      newTupleView.setByIndex(OuterTupleKey.Buckets, uint32(newBucketsByteOffset))

      this._view = newTupleView
      oldBuckets.free(allocator)
    }
  }

  private incrementSize(): number {
    const sizeView = this._view.getViewByIndex(OuterTupleKey.Size)
    const size = sizeView.get().get()
    const newSize = size + 1
    sizeView.set(uint32(newSize))
    return newSize
  }

  private decrementSize(): number {
    const sizeView = this._view.getViewByIndex(OuterTupleKey.Size)
    const size = sizeView.get().get()
    const newSize = size - 1
    sizeView.set(uint32(newSize))
    return newSize
  }
}
