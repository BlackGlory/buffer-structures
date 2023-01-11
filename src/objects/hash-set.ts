import { ISized, IHash, IReadableWritable, IClone, IDestroy } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { StructView } from '@views/struct-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { Hasher } from '@src/hasher'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { uint32 } from '@literals/uint32-literal'

type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

const createInternalViews = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(
  viewConstructor: ViewConstructor<View>
, capacity: number
) => {
  return lazyStatic(() => {
    class InternalStructView extends StructView<{
      hash: typeof Uint32View
      value: ViewConstructor<View>
    }> {
      static byteLength = StructView.getByteLength({
        key: Uint32View
      , value: viewConstructor
      })

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, {
          hash: Uint32View
        , value: viewConstructor
        })
      }
    }

    class InternalLinkedListView extends LinkedListView<InternalStructView> {
      static byteLength = LinkedListView.getByteLength(InternalStructView)

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalStructView)
      }
    }

    class InternalLinkedListOwnershipPointerView extends OwnershipPointerView<
      InternalLinkedListView
    > {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    class InternalBucketsView extends ArrayView<
      InternalLinkedListOwnershipPointerView
    , number
    > {
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

    class InternalBucketsOwnershipPointerView extends OwnershipPointerView<
      InternalBucketsView
    > {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalBucketsView)
      }
    }

    return {
      InternalLinkedListView
    , InternalBucketsView
    , InternalBucketsOwnershipPointerView
    }
  }, [viewConstructor, capacity])
})

/**
 * 在向HashSet添加新的项目后, HashSet可能会尝试对内部数组进行扩容, 从而确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashSet<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseObject
implements IClone<HashSet<View>>
         , IDestroy {
  _view: StructView<{
    size: typeof Uint32View
    buckets: ViewConstructor<OwnershipPointerView<
      ArrayView<
        OwnershipPointerView<
          LinkedListView<
            StructView<{
              hash: typeof Uint32View
              value: ViewConstructor<View>
            }>
          >
        >
      , number
      >
    >>
  }>
  readonly _counter: ReferenceCounter
  _capacity: number
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>
  private loadFactor: number
  private growthFactor: number
  private InternalLinkedListView

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getByKey('size').get()
  }

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<View>
  , _options: {
      capacity: number
      loadFactor: number
      growthFactor: number
    }
  , _byteOffset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , valueViewConstructor: ViewConstructor<View>
    , options?: {
        capacity?: number
        loadFactor?: number
        growthFactor?: number
      }
    ]
  | [
      allocator: IAllocator
    , valueViewConstructor: ViewConstructor<View>
    , options: {
        capacity: number
        loadFactor: number
        growthFactor: number
      }
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    if (args.length === 5) {
      const [allocator, viewConstructor, options, byteOffset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this._capacity = options.capacity
      this.loadFactor = options.loadFactor
      this.growthFactor = options.growthFactor

      const {
        InternalLinkedListView
      , InternalBucketsOwnershipPointerView
      } = createInternalViews(viewConstructor, options.capacity)
      this.InternalLinkedListView = InternalLinkedListView

      const rootView = new StructView(
        allocator.buffer
      , byteOffset
      , {
          size: Uint32View
        , buckets: InternalBucketsOwnershipPointerView
        }
      )
      this._view = rootView

      counter.increment()
      this._counter = counter
    } else {
      const [
        allocator
      , viewConstructor
      , {
          capacity = 1
        , loadFactor = 0.75
        , growthFactor = 2
        } = {}
      ] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this._counter = new ReferenceCounter()
      this._capacity = capacity
      this.loadFactor = loadFactor
      this.growthFactor = growthFactor

      const {
        InternalLinkedListView
      , InternalBucketsOwnershipPointerView
      , InternalBucketsView
      } = createInternalViews(viewConstructor, capacity)
      this.InternalLinkedListView = InternalLinkedListView

      const bucketsByteOffset = allocator.allocate(InternalBucketsView.byteLength)
      const bucketsView = new InternalBucketsView(allocator.buffer, bucketsByteOffset)
      // 初始化buckets中的每一个指针, 防止指向错误的位置.
      for (let i = 0; i < capacity; i++) {
        bucketsView.setByIndex(i, null)
      }

      const structByteOffset = allocator.allocate(
        StructView.getByteLength({
          size: Uint32View
        , buckets: InternalBucketsOwnershipPointerView
        })
      )
      const structView = new StructView(
        allocator.buffer
      , structByteOffset
      , {
          size: Uint32View
        , buckets: InternalBucketsOwnershipPointerView
        }
      )
      structView.set({
        size: uint32(0)
      , buckets: uint32(bucketsByteOffset)
      })

      this._view = structView
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this._view.free(this.allocator)
    }
  }

  clone(): HashSet<View> {
    this.fsm.assertAllocated()

    return new HashSet(
      this.allocator
    , this.viewConstructor
    , {
        capacity: this._capacity
      , growthFactor: this.growthFactor
      , loadFactor: this.loadFactor
      }
    , this._view.byteOffset
    , this._counter
    )
  }

  * values(): IterableIterator<View> {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    for (let i = 0; i < this._capacity; i++) {
      const pointer = buckets.getViewByIndex(i)

      let linkedList = pointer.deref()
      while (linkedList) {
        const struct = linkedList.getViewOfValue()
        yield struct.getViewByKey('value')
        linkedList = linkedList.derefNext()
      }
    }
  }

  has(value: IHash): boolean {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getValueHash(value)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('hash').get()
      if (hash === keyHash) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  add(value: UnpackedReadableWritable<View> & IHash): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getValueHash(value)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByKey('hash').get()
        if (hash === keyHash) {
          struct.setByKey('value', value)
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createLinkedList(hash, value)
            linkedList.setNext(uint32(newLinkedList.byteOffset))
            this.incrementSize()
            this.resizeWhenOverloaded()
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createLinkedList(hash, value)
      pointer.set(uint32(newLinkedList.byteOffset))
      this.incrementSize()
      this.resizeWhenOverloaded()
    }
  }

  delete(value: IHash): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getValueHash(value)
    const index = this.getIndex(hash)
    const pointer = buckets.getViewByIndex(index)

    let previous:
    | OwnershipPointerView<
        LinkedListView<
          StructView<{
            hash: typeof Uint32View
            value: ViewConstructor<View>
          }>
        >
      >
    | LinkedListView<
        StructView<{
          hash: typeof Uint32View
          value: ViewConstructor<View>
        }>
      >
    = pointer
    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('hash').get()
      if (hash === keyHash) {
        const next = linkedList.getNext()
        if (previous instanceof OwnershipPointerView) {
          previous.set(next)
        } else {
          previous.setNext(next)
        }
        linkedList.setNext(null)
        linkedList.free(this.allocator)
        this.decrementSize()
        return
      } else {
        previous = linkedList
        linkedList = linkedList.derefNext()
      }
    }
  }

  private resizeWhenOverloaded() {
    if (this.isOverloaded(this._capacity)) {
      let newCapacity = this._capacity * this.growthFactor
      while (this.isOverloaded(newCapacity)) {
        newCapacity *= this.growthFactor
      }

      this.resize(newCapacity)
    }
  }

  private isOverloaded(capacity: number): boolean {
    return this.size / capacity > this.loadFactor
  }

  private resize(newCapacity: number): void {
    if (this._capacity !== newCapacity) {
      const oldBuckets = this._view.getViewByKey('buckets').deref()!
      const {
        InternalBucketsView
      , InternalBucketsOwnershipPointerView
      } = createInternalViews(this.viewConstructor, newCapacity)

      const newBucketsByteOffset = this.allocator.allocate(
        InternalBucketsView.byteLength
      )
      const newBuckets = new InternalBucketsView(
        this.allocator.buffer
      , newBucketsByteOffset
      )
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
          const { hash, value } = oldLinkedList.getValue()
          const newIndex = keyHashToIndex(newCapacity, hash.get())

          const newPointer = newBuckets.getViewByIndex(newIndex)
          let newLinkedList = newPointer.deref()
          if (newLinkedList) {
            while (true) {
              const struct = newLinkedList.getViewOfValue()
              const newKeyHash = struct.getByKey('hash')
              if (hash === newKeyHash) {
                struct.setByKey('value', value)
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

      const newStructView = new StructView(
        this.allocator.buffer
      , this._view.byteOffset
      , {
          size: Uint32View
        , buckets: InternalBucketsOwnershipPointerView
        }
      )
      newStructView.setByKey('buckets', uint32(newBucketsByteOffset))

      this._view = newStructView
      this._capacity = newCapacity
      oldBuckets.free(this.allocator)
    }
  }

  private incrementSize(): void {
    const sizeView = this._view.getViewByKey('size')
    const size = sizeView.get().get()
    sizeView.set(uint32(size + 1))
  }

  private decrementSize(): void {
    const sizeView = this._view.getViewByKey('size')
    const size = sizeView.get().get()
    sizeView.set(uint32(size - 1))
  }

  private getValueHash(value: IHash): number {
    const hasher = new Hasher()
    value.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private getIndex(hash: number): number {
    const index = hash % this._capacity
    return index
  }

  private createLinkedList(hash: number, value: UnpackedReadableWritable<View>) {
    const byteOffset = this.allocator.allocate(this.InternalLinkedListView.getByteLength())
    const linkedList = new this.InternalLinkedListView(this.allocator.buffer, byteOffset)
    linkedList.set({
      next: null
    , value: {
        hash: uint32(hash)
      , value
      }
    })
    return linkedList
  }
}

function keyHashToIndex(capacity: number, hash: number): number {
  const index = hash % capacity
  return index
}
