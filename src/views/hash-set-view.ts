import { ISized, IHash, IReadableWritable, IReference, IFree } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { TupleView, MapStructureToTupleValue } from '@views/tuple-view'
import { Hasher } from '@src/hasher'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { uint32, Uint32Literal } from '@literals/uint32-literal'
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
, Value
}

type IInternalTupleView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = TupleView<[
  hash: typeof Uint32View
, value: ViewConstructor<View>
]>

type IInternalLinkedListView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = LinkedListView<IInternalTupleView<View>>

type IInternalLinkedListOwnershipPointerView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<IInternalLinkedListView<View>>

type IInternalBucketsView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = ArrayView<IInternalLinkedListOwnershipPointerView<View>, number>

type IInternalBucketsOwnershipPointerView<
  View extends BaseView & IReadableWritable<unknown> & IHash
> = OwnershipPointerView<IInternalBucketsView<View>>

export const createInternalViews = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(
  viewConstructor: ViewConstructor<View>
, capacity: number
): {
  InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>
  InternalBucketsView: ViewConstructor<IInternalBucketsView<View>>
  InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
} => {
  const structure = lazyStatic(() => {
    return [Uint32View, viewConstructor] satisfies [
      hash: typeof Uint32View
    , value: ViewConstructor<View>
    ]
  }, [viewConstructor])

  return lazyStatic((): {
    InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>
    InternalBucketsView: ViewConstructor<IInternalBucketsView<View>>
    InternalBucketsOwnershipPointerView: ViewConstructor<IInternalBucketsOwnershipPointerView<View>>
  } => {
    class InternalTupleView
    extends TupleView<[
      hash: typeof Uint32View
    , value: ViewConstructor<View>
    ]>
    implements IInternalTupleView<View> {
      static byteLength = TupleView.getByteLength([
        Uint32View
      , viewConstructor
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
    implements IInternalLinkedListView<View> {
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
    implements IInternalLinkedListOwnershipPointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    class InternalBucketsView
    extends ArrayView<InternalLinkedListOwnershipPointerView, number>
    implements IInternalBucketsView<View> {
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
    implements IInternalBucketsOwnershipPointerView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalBucketsView)
      }
    }

    return {
      InternalLinkedListView
    , InternalBucketsView
    , InternalBucketsOwnershipPointerView
    }
  }, [structure, capacity])
})

type HashSetStructure<View extends BaseView & IReadableWritable<unknown> & IHash> = [
  size: typeof Uint32View
, buckets: ViewConstructor<OwnershipPointerView<
    ArrayView<
      OwnershipPointerView<
        LinkedListView<
          TupleView<[
            hash: typeof Uint32View
          , value: ViewConstructor<View>
          ]>
        >
      >
    , number
    >
  >>
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

  private _capacity: number
  readonly loadFactor: number
  readonly growthFactor: number
  private InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>

  get capacity(): number {
    return this._capacity
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

    this._capacity = capacity
    this.loadFactor = loadFactor
    this.growthFactor = growthFactor

    const {
      InternalLinkedListView
    , InternalBucketsOwnershipPointerView
    } = createInternalViews(viewConstructor, capacity)
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

  set(value: MapStructureToTupleValue<HashSetStructure<View>>): void {
    this._view.set(value)
  }

  get(): MapStructureToTupleValue<HashSetStructure<View>> {
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

  derefBuckets(): ArrayView<
    OwnershipPointerView<
      LinkedListView<
        TupleView<[
          hash: typeof Uint32View
        , value: ViewConstructor<View>
        ]>
      >
    >
  , number
  > | null {
    return this._view.getViewByIndex(OuterTupleKey.Buckets).deref()
  }

  * itemValues(): IterableIterator<View> {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    for (let i = 0; i < this._capacity; i++) {
      const pointer = buckets.getViewByIndex(i)

      let linkedList = pointer.deref()
      while (linkedList) {
        const struct = linkedList.getViewOfValue()
        yield struct.getViewByIndex(InnerTupleKey.Value)
        linkedList = linkedList.derefNext()
      }
    }
  }

  hasItem(value: IHash): boolean {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckest does not exist')

    const hash = this.getValueHash(value)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByIndex(InnerTupleKey.Hash).get()
      if (hash === keyHash) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  addItem(allocator: IAllocator, value: UnpackedReadableWritable<View> & IHash): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckest does not exist')

    const hash = this.getValueHash(value)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByIndex(InnerTupleKey.Hash).get()
        if (hash === keyHash) {
          struct.setByIndex(InnerTupleKey.Value, value)
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createLinkedList(allocator, hash, value)
            linkedList.setNext(uint32(newLinkedList.byteOffset))
            const size = this.incrementSize()
            this.resizeBucketsWhenOverloaded(allocator, size)
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createLinkedList(allocator, hash, value)
      pointer.set(uint32(newLinkedList.byteOffset))
      const size = this.incrementSize()
      this.resizeBucketsWhenOverloaded(allocator, size)
    }
  }

  deleteItem(allocator: IAllocator, value: IHash): void {
    const buckets = this.derefBuckets()
    assert(buckets, 'buckets does not exist')

    const hash = this.getValueHash(value)
    const index = this.getItemIndex(hash)
    const pointer = buckets.getViewByIndex(index)

    let previous:
    | OwnershipPointerView<
        LinkedListView<
          TupleView<[
            hash: typeof Uint32View
          , value: ViewConstructor<View>
          ]>
        >
      >
    | LinkedListView<
        TupleView<[
          hash: typeof Uint32View
        , value: ViewConstructor<View>
        ]>
      >
    = pointer
    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByIndex(InnerTupleKey.Hash).get()
      if (hash === keyHash) {
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

  private resizeBucketsWhenOverloaded(allocator: IAllocator, size: number): void {
    if (this.isOverloaded(size, this._capacity, this.loadFactor)) {
      let newCapacity = this._capacity * this.growthFactor
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
    if (this._capacity !== newCapacity) {
      const oldBuckets = this.derefBuckets()
      assert(oldBuckets, 'buckets does not exist')

      const {
        InternalBucketsView
      , InternalBucketsOwnershipPointerView
      } = createInternalViews(this.viewConstructor, newCapacity)

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
          const [hash, value] = oldLinkedList.getValue()
          const newIndex = keyHashToIndex(newCapacity, hash.get())

          const newPointer = newBuckets.getViewByIndex(newIndex)
          let newLinkedList = newPointer.deref()
          if (newLinkedList) {
            while (true) {
              const struct = newLinkedList.getViewOfValue()
              const newKeyHash = struct.getByIndex(InnerTupleKey.Hash)
              if (hash === newKeyHash) {
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

  private getValueHash(value: IHash): number {
    const hasher = new Hasher()
    value.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private getItemIndex(hash: number): number {
    const index = hash % this._capacity
    return index
  }

  private createLinkedList(
    allocator: IAllocator
  , hash: number
  , value: UnpackedReadableWritable<View>
  ): IInternalLinkedListView<View> {
    const byteOffset = allocator.allocate(this.InternalLinkedListView.byteLength)
    const linkedList = new this.InternalLinkedListView(allocator.buffer, byteOffset)
    linkedList.set([null, [uint32(hash), value]])
    return linkedList
  }
}

function keyHashToIndex(capacity: number, hash: number): number {
  const index = hash % capacity
  return index
}
