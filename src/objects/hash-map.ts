import { IAllocator, ISized, IHash, IReadableWritable, IClone, IDestroy } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { StructView } from '@views/struct-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { Hasher } from '@src/hasher'

type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export class HashMap<
  KeyView extends IHash
, ValueView extends IReadableWritable<Value> & IHash
, Value = ValueView extends IReadableWritable<infer T> ? T : never
> implements IClone<HashMap<KeyView, ValueView, Value>>
           , IDestroy {
  readonly _view: ArrayView<
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
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private valueViewConstructor: ViewConstructor<ValueView>
  private capacity: number
  private InternalLinkedListView

  constructor(
    allocator: IAllocator
  , valueViewConstructor: ViewConstructor<ValueView>
  , capacity: number
  )
  constructor(
    _allocator: IAllocator
  , _valueViewConstructor: ViewConstructor<ValueView>
  , _capacity: number
  , _byteOffset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , valueViewConstructor: ViewConstructor<ValueView>
    , capacity: number
    ]
  | [
      allocator: IAllocator
    , valueViewConstructor: ViewConstructor<ValueView>
    , capacity: number
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    if (args.length === 5) {
      const [allocator, valueViewConstructor, capacity, byteOffset, counter] = args
      this.allocator = allocator
      this.valueViewConstructor = valueViewConstructor
      this.capacity = capacity

      class InternalStructView extends StructView<{
        keyHash: typeof Uint32View
        value: ViewConstructor<ValueView>
      }> {
        static byteLength = StructView.getByteLength({
          key: Uint32View
        , value: valueViewConstructor
        })

        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, {
            keyHash: Uint32View
          , value: valueViewConstructor
          })
        }
      }

      class InternalLinkedListView extends LinkedListView<InternalStructView> {
        static byteLength = LinkedListView.getByteLength(InternalStructView)

        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, InternalStructView)
        }
      }
      this.InternalLinkedListView = InternalLinkedListView

      class InternalOwnershipPointerView extends OwnershipPointerView<
        InternalLinkedListView
      > {
        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, InternalLinkedListView)
        }
      }

      const view = new ArrayView<
        OwnershipPointerView<
          LinkedListView<
            StructView<{
              keyHash: typeof Uint32View
              value: ViewConstructor<ValueView>
            }>
          >
        >
      , number
      >(
        allocator.buffer
      , byteOffset
      , InternalOwnershipPointerView
      , capacity
      )
      this._view = view

      counter.increment()
      this._counter = counter
    } else {
      const [allocator, valueViewConstructor, capacity] = args
      this.allocator = allocator
      this.valueViewConstructor = valueViewConstructor
      this.capacity = capacity
      this._counter = new ReferenceCounter()

      class InternalStructView extends StructView<{
        keyHash: typeof Uint32View
        value: ViewConstructor<ValueView>
      }> {
        static byteLength = StructView.getByteLength({
          keyHash: Uint32View
        , value: valueViewConstructor
        })

        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, {
            keyHash: Uint32View
          , value: valueViewConstructor
          })
        }
      }

      class InternalLinkedListView extends LinkedListView<InternalStructView> {
        static byteLength = LinkedListView.getByteLength(InternalStructView)

        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, InternalStructView)
        }
      }
      this.InternalLinkedListView = InternalLinkedListView

      class InternalOwnershipPointerView extends OwnershipPointerView<
        InternalLinkedListView
      > {
        constructor(buffer: ArrayBufferLike, byteOffset: number) {
          super(buffer, byteOffset, InternalLinkedListView)
        }
      }

      const byteOffset = allocator.allocate(
        ArrayView.getByteLength(InternalOwnershipPointerView, capacity)
      )
      const view = new ArrayView<
        OwnershipPointerView<
          LinkedListView<
            StructView<{
              keyHash: typeof Uint32View
              value: ViewConstructor<ValueView>
            }>
          >
        >
      , number
      >(
        allocator.buffer
      , byteOffset
      , InternalOwnershipPointerView
      , capacity
      )
      // 初始化每一个指针, 防止指向错误的位置.
      for (let i = 0; i < capacity; i++) {
        view.setByIndex(i, null)
      }
      this._view = view
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): HashMap<KeyView, ValueView, Value> {
    this.fsm.assertAllocated()

    return new HashMap(
      this.allocator
    , this.valueViewConstructor
    , this.capacity
    , this._view.byteOffset
    , this._counter
    )
  }

  has(keyView: KeyView): boolean {
    this.fsm.assertAllocated()

    const hash = this.getHash(keyView)
    const index = this.getIndex(hash)
    const pointer = this._view.getViewByIndex(index)

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

  get(keyView: KeyView): ValueView | undefined {
    this.fsm.assertAllocated()

    const hash = this.getHash(keyView)
    const index = this.getIndex(hash)
    const pointer = this._view.getViewByIndex(index)

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

  set(keyView: KeyView, valueView: ValueView): void {
    this.fsm.assertAllocated()

    const hash = this.getHash(keyView)
    const index = this.getIndex(hash)
    const pointer = this._view.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByKey('keyHash')
        if (hash === keyHash) {
          // @ts-ignore
          struct.setByKey('value', valueView.get())
          return
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createNewLinkedList(hash, valueView)
            linkedList.setNext(newLinkedList.byteOffset)
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createNewLinkedList(hash, valueView)
      pointer.set(newLinkedList.byteOffset)
    }
  }

  delete(keyView: KeyView): void {
    this.fsm.assertAllocated()

    const hash = this.getHash(keyView)
    const index = this.getIndex(hash)
    const pointer = this._view.getViewByIndex(index)

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
        return
      } else {
        previous = linkedList
        linkedList = linkedList.derefNext()
      }
    }
  }

  private getHash(key: KeyView): number {
    const hasher = new Hasher()
    key.hash(hasher)
    const hash = hasher.finish()
    return hash
  }

  private getIndex(hash: number): number {
    const index = hash % this.capacity
    return index
  }

  private createNewLinkedList(keyHash: number, valueView: ValueView) {
    const byteOffset = this.allocator.allocate(this.InternalLinkedListView.byteLength)
    const linkedList = new this.InternalLinkedListView(
      this.allocator.buffer
    , byteOffset
    )
    linkedList.set({
      next: null
    , value: {
        keyHash
        // @ts-ignore
      , value: valueView.get()
      }
    })
    return linkedList
  }
}
