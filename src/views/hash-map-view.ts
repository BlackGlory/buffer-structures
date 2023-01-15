import { ISized, IHash, IReadableWritable, IReference, IFree } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { TupleView } from '@views/tuple-view'
import { Hasher } from '@src/hasher'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { uint32 } from '@literals/uint32-literal'
import { map } from 'iterable-operator'
import { assert } from '@blackglory/prelude'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

enum OuterTupleKey {
  Size
, Buckets
}

enum InnerTupleKey {
  Hash
, Key
, Value
}

type IInternalTupleView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = TupleView<[
  hash: typeof Uint32View
, key: ViewConstructor<KeyView>
, value: ViewConstructor<ValueView>
]>

type IInternalLinkedListView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = LinkedListView<IInternalTupleView<KeyView, ValueView>>

type IInternalLinkedListOwnershipPointerView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<IInternalLinkedListView<KeyView, ValueView>>

type IInternalBucketsView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = ArrayView<IInternalLinkedListOwnershipPointerView<KeyView, ValueView>, number>

type IInternalBucketsOwnershipPointerView<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<IInternalBucketsView<KeyView, ValueView>>

export const createInternalViews = withLazyStatic(<
  KeyView extends BaseView & IReadableWritable<unknown> & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>(
  keyViewConstructor: ViewConstructor<KeyView>
, valueViewConstructor: ViewConstructor<ValueView>
, capacity: number
): {
  InternalLinkedListView: ViewConstructor<IInternalLinkedListView<KeyView, ValueView>>
  InternalBucketsView: ViewConstructor<IInternalBucketsView<KeyView, ValueView>>
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
    InternalLinkedListView: ViewConstructor<IInternalLinkedListView<KeyView, ValueView>>
    InternalBucketsView: ViewConstructor<IInternalBucketsView<KeyView, ValueView>>
    InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<KeyView, ValueView>>
  } => {
    class InternalTupleView
    extends TupleView<[
      hash: typeof Uint32View
    , key: ViewConstructor<KeyView>
    , value: ViewConstructor<ValueView>
    ]>
    implements IInternalTupleView<KeyView, ValueView> {
      static byteLength = TupleView.getByteLength([
        Uint32View
      , keyViewConstructor
      , valueViewConstructor
      ])

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, structure)
      }
    }

    class InternalLinkedListView
    extends LinkedListView<InternalTupleView>
    implements IInternalLinkedListView<KeyView, ValueView> {
      static byteLength = LinkedListView.getByteLength(InternalTupleView)

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalTupleView)
      }
    }

    class InternalLinkedListOwnershipPointerView
    extends OwnershipPointerView<InternalLinkedListView>
    implements IInternalLinkedListOwnershipPointerView<KeyView, ValueView> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    class InternalBucketsView
    extends ArrayView<InternalLinkedListOwnershipPointerView, number>
    implements IInternalBucketsView<KeyView, ValueView> {
      static byteLength = ArrayView.getByteLength(
        InternalLinkedListOwnershipPointerView
      , capacity
      )

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListOwnershipPointerView, capacity)
      }
    }

    class InternalBucketsOwnershipPointerView
    extends OwnershipPointerView<InternalBucketsView>
    implements IInternalBucketsOwnershipPointerView<KeyView, ValueView> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalBucketsView)
      }
    }

    return {
      InternalLinkedListView
    , InternalBucketsOwnershipPointerView
    , InternalBucketsView
    }
  }, [structure, capacity])
})

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
  _view: TupleView<[
    size: typeof Uint32View
  , buckets: ViewConstructor<OwnershipPointerView<
      ArrayView<
        OwnershipPointerView<
          LinkedListView<
            TupleView<[
              hash: typeof Uint32View
            , key: ViewConstructor<KeyView>
            , value: ViewConstructor<ValueView>
            ]>
          >
        >
      , number
      >
    >>
  ]>
  private _capacity: number
  public readonly loadFactor: number
  public readonly growthFactor: number
  private InternalLinkedListView: ViewConstructor<
    IInternalLinkedListView<KeyView, ValueView>
  >

  get capacity(): number {
    return this._capacity
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

    this._capacity = capacity
    this.loadFactor = loadFactor
    this.growthFactor = growthFactor

    const {
      InternalLinkedListView
    , InternalBucketsOwnershipPointerView
    } = createInternalViews(keyViewConstructor, valueViewConstructor, capacity)
    this.InternalLinkedListView = InternalLinkedListView

    const rootView = new TupleView(
      buffer
    , byteOffset
    , [
        Uint32View
      , InternalBucketsOwnershipPointerView
      ]
    )
    this._view = rootView
  }

  free(allocator: IAllocator): void {
    this._view.free(allocator)
  }

  getSize(): number {
    return this._view.getByIndex(OuterTupleKey.Size).get()
  }

  getViewOfBuckets(): ArrayView<
    OwnershipPointerView<
      LinkedListView<
        TupleView<[
          hash: typeof Uint32View
        , key: ViewConstructor<KeyView>
        , value: ViewConstructor<ValueView>
        ]>
      >
    >
  , number
  > | null {
    return this._view.getViewByIndex(OuterTupleKey.Buckets).deref()
  }

  * entries(): IterableIterator<[KeyView, ValueView]> {
    const buckets = this.getViewOfBuckets()
    assert(buckets, 'buckets does not exist')

    for (let i = 0; i < this._capacity; i++) {
      const pointer = buckets.getViewByIndex(i)

      let linkedList = pointer.deref()
      while (linkedList) {
        const struct = linkedList.getViewOfValue()
        yield [
          struct.getViewByIndex(InnerTupleKey.Key)
        , struct.getViewByIndex(InnerTupleKey.Value)
        ]
        linkedList = linkedList.derefNext()
      }
    }
  }

  keys(): IterableIterator<KeyView> {
    return map(this.entries(), ([key]) => key)
  }

  values(): IterableIterator<ValueView> {
    return map(this.entries(), ([, value]) => value)
  }

  has(key: IHash): boolean {
    const buckets = this.getViewOfBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByIndex(InnerTupleKey.Hash)
      if (hash === keyHash.get()) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  get(key: IHash): ValueView | undefined {
    const buckets = this.getViewOfBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByIndex(InnerTupleKey.Hash)
      if (hash === keyHash.get()) {
        const value = struct.getViewByIndex(InnerTupleKey.Value)
        return value
      } else {
        linkedList = linkedList.derefNext()
      }
    }
  }

  set(
    allocator: IAllocator
  , key: IHash & UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): void {
    const buckets = this.getViewOfBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByIndex(InnerTupleKey.Hash)
        if (hash === keyHash.get()) {
          struct.setByIndex(InnerTupleKey.Key, key)
          struct.setByIndex(InnerTupleKey.Value, value)
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createLinkedList(allocator, hash, key, value)
            linkedList.setNext(uint32(newLinkedList.byteOffset))
            const size = this.incrementSize()
            this.resizeWhenOverloaded(allocator, size)
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createLinkedList(allocator, hash, key, value)
      pointer.set(uint32(newLinkedList.byteOffset))
      const size = this.incrementSize()
      this.resizeWhenOverloaded(allocator, size)
    }
  }

  delete(allocator: IAllocator, key: IHash): void {
    const buckets = this.getViewOfBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let previous:
    | OwnershipPointerView<
        LinkedListView<
          TupleView<[
            hash: typeof Uint32View
          , key: ViewConstructor<KeyView>
          , value: ViewConstructor<ValueView>
          ]>
        >
      >
    | LinkedListView<
        TupleView<[
          hash: typeof Uint32View
        , key: ViewConstructor<KeyView>
        , value: ViewConstructor<ValueView>
        ]>
      >
    = pointer
    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByIndex(InnerTupleKey.Hash)
      if (hash === keyHash.get()) {
        const next = linkedList.getNext()
        if (previous instanceof OwnershipPointerView) {
          previous.set(next)
        } else {
          previous.setNext(next)
        }
        linkedList.setNext(null)
        linkedList.free(allocator)
        this.decrementSize()
        return
      } else {
        previous = linkedList
        linkedList = linkedList.derefNext()
      }
    }
  }

  private resizeWhenOverloaded(allocator: IAllocator, size: number): void {
    if (this.isOverloaded(size, this._capacity, this.loadFactor)) {
      let newCapacity = this._capacity * this.growthFactor
      while (this.isOverloaded(size, newCapacity, this.loadFactor)) {
        newCapacity *= this.growthFactor
      }

      this.resize(allocator, newCapacity)
    }
  }

  private isOverloaded(size: number, capacity: number, loadFactor: number): boolean {
    return size / capacity > loadFactor
  }

  private resize(allocator: IAllocator, newCapacity: number): void {
    if (this._capacity !== newCapacity) {
      const oldBuckets = this.getViewOfBuckets()
      assert(oldBuckets, 'buckets does not exist')

      const {
        InternalBucketsView
      , InternalBucketsOwnershipPointerView
      } = createInternalViews(this.keyViewConstructor, this.valueViewConstructor, newCapacity)

      const newBucketsByteOffset = allocator.allocate(InternalBucketsView.byteLength)
      const newBuckets = new InternalBucketsView(allocator.buffer, newBucketsByteOffset)
      // 初始化buckets中的每一个指针, 防止指向错误的位置.
      for (let i = 0; i < newCapacity; i++) {
        newBuckets.setByIndex(i, null)
      }

      for (let i = 0; i < oldBuckets.length; i++) {
        const oldPointer = oldBuckets.getViewByIndex(i)

        let oldLinkedList = oldPointer.deref()
        if (oldLinkedList) {
          oldPointer.set(null)
        }

        while (oldLinkedList) {
          const [keyHash, key, value] = oldLinkedList.getValue()
          const newIndex = keyHashToIndex(newCapacity, keyHash.get())

          const newPointer = newBuckets.getViewByIndex(newIndex)
          let newLinkedList = newPointer.deref()
          if (newLinkedList) {
            while (true) {
              const struct = newLinkedList.getViewOfValue()
              const newKeyHash = struct.getByIndex(InnerTupleKey.Hash)
              if (keyHash === newKeyHash) {
                struct.setByIndex(InnerTupleKey.Key, key)
                struct.setByIndex(InnerTupleKey.Value, value)
                break
              } else {
                const nextNewLinkedList = newLinkedList.derefNext()
                if (nextNewLinkedList) {
                  newLinkedList = nextNewLinkedList
                } else {
                  const nextOldLinkedList = oldLinkedList.derefNext()
                  oldLinkedList.setNext(null)
                  newLinkedList.setNext(uint32(oldLinkedList.byteOffset))
                  oldLinkedList = nextOldLinkedList
                  break
                }
              }
            }
          } else {
            const nextOldLinkedList = oldLinkedList.derefNext()
            oldLinkedList.setNext(null)
            newPointer.set(uint32(oldLinkedList.byteOffset))
            oldLinkedList = nextOldLinkedList
          }
        }
      }

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
      this._capacity = newCapacity
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

  private getKeyHash(key: IHash): number {
    const hasher = new Hasher()
    key.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private createLinkedList(
    allocator: IAllocator
  , hash: number
  , key: UnpackedReadableWritable<KeyView>
  , value: UnpackedReadableWritable<ValueView>
  ): IInternalLinkedListView<KeyView, ValueView> {
    const byteOffset = allocator.allocate(this.InternalLinkedListView.byteLength)
    const linkedList = new this.InternalLinkedListView(allocator.buffer, byteOffset)
    linkedList.set([null, [uint32(hash), key, value]])
    return linkedList
  }
}

function keyHashToIndex(capacity: number, hash: number): number {
  const index = hash % capacity
  return index
}
