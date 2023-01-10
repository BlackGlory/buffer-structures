import { IAllocator, ISized, IHash, IReadableWritable, IClone, IDestroy, PickReadableWritable } from '@src/types'
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

type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

const createInternalViews = withLazyStatic(<
  ValueView extends BaseView & IReadableWritable<unknown> & IHash
>(
  valueViewConstructor: ViewConstructor<ValueView>
, capacity: number
) => {
  return lazyStatic(() => {
    class InternalStructView extends StructView<{
      keyHash: typeof Uint32View
      value: ViewConstructor<ValueView>
    }> {
      static byteLength = StructView.getByteLength({
        key: Uint32View
      , value: valueViewConstructor
      })

      static override getByteLength(): number {
        return this.byteLength
      }

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, {
          keyHash: Uint32View
        , value: valueViewConstructor
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
  }, [valueViewConstructor, capacity])
})

/**
 * 在向HashMap添加新的项目后, HashMap会根据负载因子(load factor)尝试对内部数组进行扩容,
 * 确保当前负载总是低于或等于负载因子.
 * 扩容无法发生在添加项目之前, 因为在添加前无法知道添加项目后的负载情况会增长还是不变.
 */
export class HashMap<
  KeyView extends BaseView & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseObject
implements IClone<HashMap<KeyView, ValueView>>
         , IDestroy {
  _view: StructView<{
    size: typeof Uint32View
    buckets: ViewConstructor<OwnershipPointerView<
      ArrayView<
        OwnershipPointerView<
          LinkedListView<
            StructView<{
              keyHash: typeof Uint32View
              value: ViewConstructor<ValueView>
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
  private valueViewConstructor: ViewConstructor<ValueView>
  private loadFactor: number
  private growthFactor: number
  private InternalLinkedListView

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getByKey('size')
  }

  constructor(
    allocator: IAllocator
  , valueViewConstructor: ViewConstructor<ValueView>
  , options?: {
      capacity?: number
      loadFactor?: number
      growthFactor?: number
    }
  )
  constructor(
    _allocator: IAllocator
  , _valueViewConstructor: ViewConstructor<ValueView>
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
    , valueViewConstructor: ViewConstructor<ValueView>
    , options?: {
        capacity?: number
        loadFactor?: number
        growthFactor?: number
      }
    ]
  | [
      allocator: IAllocator
    , valueViewConstructor: ViewConstructor<ValueView>
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
      const [allocator, valueViewConstructor, options, byteOffset, counter] = args
      this.allocator = allocator
      this.valueViewConstructor = valueViewConstructor
      this._capacity = options.capacity
      this.loadFactor = options.loadFactor
      this.growthFactor = options.growthFactor

      const {
        InternalLinkedListView
      , InternalBucketsOwnershipPointerView
      } = createInternalViews(valueViewConstructor, options.capacity)
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
      , valueViewConstructor
      , {
          capacity = 1
        , loadFactor = 0.75
        , growthFactor = 2
        } = {}
      ] = args
      this.allocator = allocator
      this.valueViewConstructor = valueViewConstructor
      this._capacity = capacity
      this.loadFactor = loadFactor
      this.growthFactor = growthFactor
      this._counter = new ReferenceCounter()

      const {
        InternalLinkedListView
      , InternalBucketsOwnershipPointerView
      , InternalBucketsView
      } = createInternalViews(valueViewConstructor, capacity)
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
        size: 0
      , buckets: bucketsByteOffset
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

  clone(): HashMap<KeyView, ValueView> {
    this.fsm.assertAllocated()

    return new HashMap(
      this.allocator
    , this.valueViewConstructor
    , {
        capacity: this._capacity
      , growthFactor: this.growthFactor
      , loadFactor: this.loadFactor
      }
    , this._view.byteOffset
    , this._counter
    )
  }

  * values(): IterableIterator<ValueView> {
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

  has(key: IHash): boolean {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('keyHash')
      if (hash === keyHash) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  get(key: IHash): ValueView | undefined {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('keyHash')
      if (hash === keyHash) {
        const value = struct.getViewByKey('value')
        return value
      } else {
        linkedList = linkedList.derefNext()
      }
    }
  }

  set(key: IHash, value: PickReadableWritable<ValueView>): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByKey('keyHash')
        if (hash === keyHash) {
          struct.setByKey('value', value.get())
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createLinkedList(hash, value)
            linkedList.setNext(newLinkedList.byteOffset)
            this.incrementSize()
            this.resizeWhenOverloaded()
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createLinkedList(hash, value)
      pointer.set(newLinkedList.byteOffset)
      this.incrementSize()
      this.resizeWhenOverloaded()
    }
  }

  delete(key: IHash): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets').deref()!
    const hash = this.getKeyHash(key)
    const index = keyHashToIndex(this._capacity, hash)
    const pointer = buckets.getViewByIndex(index)

    let previous:
    | OwnershipPointerView<
        LinkedListView<
          StructView<{
            keyHash: typeof Uint32View
            value: ViewConstructor<ValueView>
          }>
        >
      >
    | LinkedListView<
        StructView<{
          keyHash: typeof Uint32View
          value: ViewConstructor<ValueView>
        }>
      >
    = pointer
    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('keyHash')
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
      } = createInternalViews(this.valueViewConstructor, newCapacity)

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
          const { keyHash, value } = oldLinkedList.getValue()
          const newIndex = keyHashToIndex(newCapacity, keyHash)

          const newPointer = newBuckets.getViewByIndex(newIndex)
          let newLinkedList = newPointer.deref()
          if (newLinkedList) {
            while (true) {
              const struct = newLinkedList.getViewOfValue()
              const newKeyHash = struct.getByKey('keyHash')
              if (keyHash === newKeyHash) {
                struct.setByKey('value', value)
                break
              } else {
                const nextNewLinkedList = newLinkedList.derefNext()
                if (nextNewLinkedList) {
                  newLinkedList = nextNewLinkedList
                } else {
                  const nextOldLinkedList = oldLinkedList.derefNext()
                  oldLinkedList.setNext(null)
                  newLinkedList.setNext(oldLinkedList.byteOffset)
                  oldLinkedList = nextOldLinkedList
                  break
                }
              }
            }
          } else {
            const nextOldLinkedList = oldLinkedList.derefNext()
            oldLinkedList.setNext(null)
            newPointer.set(oldLinkedList.byteOffset)
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
      newStructView.setByKey('buckets', newBucketsByteOffset)

      this._view = newStructView
      this._capacity = newCapacity
      oldBuckets.free(this.allocator)
    }
  }

  private incrementSize(): void {
    const size = this._view.getViewByKey('size')
    size.set(size.get() + 1)
  }

  private decrementSize(): void {
    const size = this._view.getViewByKey('size')
    size.set(size.get() - 1)
  }

  private getKeyHash(key: IHash): number {
    const hasher = new Hasher()
    key.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private createLinkedList(keyHash: number, value: PickReadableWritable<ValueView>) {
    const byteOffset = this.allocator.allocate(this.InternalLinkedListView.getByteLength())
    const linkedList = new this.InternalLinkedListView(this.allocator.buffer, byteOffset)
    linkedList.set({
      next: null
    , value: {
        keyHash
      , value: value.get()
      }
    })
    return linkedList
  }
}

function keyHashToIndex(capacity: number, hash: number): number {
  const index = hash % capacity
  return index
}
