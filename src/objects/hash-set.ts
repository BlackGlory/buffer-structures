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

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, {
          hash: Uint32View
        , value: viewConstructor
        })
      }
    }

    class InternalLinkedListView extends LinkedListView<InternalStructView> {
      static byteLength = LinkedListView.getByteLength(InternalStructView)

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

    class InternalArrayView extends ArrayView<
      InternalLinkedListOwnershipPointerView
    , number
    > {
      static byteLength = ArrayView.getByteLength(
        InternalLinkedListOwnershipPointerView
      , capacity
      )

      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListOwnershipPointerView, capacity)
      }
    }

    return { InternalLinkedListView, InternalArrayView }
  }, [viewConstructor, capacity])
})

export class HashSet<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseObject
implements IClone<HashSet<View>>
         , IDestroy {
  readonly _view: StructView<{
    size: typeof Uint32View
    buckets: ViewConstructor<ArrayView<
      OwnershipPointerView<
        LinkedListView<
          StructView<{
            hash: typeof Uint32View
            value: ViewConstructor<View>
          }>
        >
      >
    , number
    >>
  }>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>
  private capacity: number
  private InternalLinkedListView

  get size(): number {
    this.fsm.assertAllocated()

    return this._view.getByKey('size')
  }

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , capacity: number
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<View>
  , _capacity: number
  , _byteOffset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , capacity: number
    ]
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , capacity: number
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    if (args.length === 5) {
      const [allocator, viewConstructor, capacity, byteOffset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.capacity = capacity

      const {
        InternalLinkedListView
      , InternalArrayView
      } = createInternalViews(viewConstructor, capacity)
      this.InternalLinkedListView = InternalLinkedListView

      const view = new StructView(
        allocator.buffer
      , byteOffset
      , {
          size: Uint32View
        , buckets: InternalArrayView
        }
      )
      this._view = view

      counter.increment()
      this._counter = counter
    } else {
      const [allocator, viewConstructor, capacity] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.capacity = capacity
      this._counter = new ReferenceCounter()

      const {
        InternalLinkedListView
      , InternalArrayView
      } = createInternalViews(viewConstructor, capacity)
      this.InternalLinkedListView = InternalLinkedListView

      const byteOffset = allocator.allocate(
        StructView.getByteLength({
          size: Uint32View
        , buckets: InternalArrayView
        })
      )
      const view = new StructView(
        allocator.buffer
      , byteOffset
      , {
          size: Uint32View
        , buckets: InternalArrayView
        }
      )
      // 初始化size
      view.setByKey('size', 0)
      const buckets = view.getViewByKey('buckets')
      // 初始化buckets中的每一个指针, 防止指向错误的位置.
      for (let i = 0; i < capacity; i++) {
        buckets.setByIndex(i, null)
      }
      this._view = view
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
    , this.capacity
    , this._view.byteOffset
    , this._counter
    )
  }

  has(value: IHash): boolean {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets')
    const hash = this.getHash(value)
    const index = this.getIndex(hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const struct = linkedList.getViewOfValue()
      const keyHash = struct.getByKey('hash')
      if (hash === keyHash) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  add(value: PickReadableWritable<View> & IHash): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets')
    const hash = this.getHash(value)
    const index = this.getIndex(hash)
    const pointer = buckets.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByKey('hash')
        if (hash === keyHash) {
          struct.setByKey('value', value.get())
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createNewLinkedList(hash, value)
            linkedList.setNext(newLinkedList.byteOffset)
            this.incrementSize()
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createNewLinkedList(hash, value)
      pointer.set(newLinkedList.byteOffset)
      this.incrementSize()
    }
  }

  delete(value: IHash): void {
    this.fsm.assertAllocated()

    const buckets = this._view.getViewByKey('buckets')
    const hash = this.getHash(value)
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
      const keyHash = struct.getByKey('hash')
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

  private incrementSize(): void {
    const size = this._view.getViewByKey('size')
    size.set(size.get() + 1)
  }

  private decrementSize(): void {
    const size = this._view.getViewByKey('size')
    size.set(size.get() - 1)
  }

  private getHash(key: IHash): number {
    const hasher = new Hasher()
    key.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private getIndex(hash: number): number {
    const index = hash % this.capacity
    return index
  }

  private createNewLinkedList(hash: number, value: PickReadableWritable<View>) {
    const byteOffset = this.allocator.allocate(this.InternalLinkedListView.byteLength)
    const linkedList = new this.InternalLinkedListView(
      this.allocator.buffer
    , byteOffset
    )
    linkedList.set({
      next: null
    , value: {
        hash: hash
      , value: value.get()
      }
    })
    return linkedList
  }
}
