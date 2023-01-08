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

type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export class HashMap<
  KeyView extends BaseView & IHash
, ValueView extends BaseView & IReadableWritable<unknown> & IHash
>
extends BaseObject
implements IClone<HashMap<KeyView, ValueView>>
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
    super()

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
      this._view.free(this.allocator)
    }
  }

  clone(): HashMap<KeyView, ValueView> {
    this.fsm.assertAllocated()

    return new HashMap(
      this.allocator
    , this.valueViewConstructor
    , this.capacity
    , this._view.byteOffset
    , this._counter
    )
  }

  has(key: IHash): boolean {
    this.fsm.assertAllocated()

    const hash = this.getHash(key)
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

  get(key: IHash): ValueView | undefined {
    this.fsm.assertAllocated()

    const hash = this.getHash(key)
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

  set(key: IHash, value: PickReadableWritable<ValueView>): void {
    this.fsm.assertAllocated()

    const hash = this.getHash(key)
    const index = this.getIndex(hash)
    const pointer = this._view.getViewByIndex(index)

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
            const newLinkedList = this.createNewLinkedList(hash, value)
            linkedList.setNext(newLinkedList.byteOffset)
            return
          }
        }
      }
    } else {
      const newLinkedList = this.createNewLinkedList(hash, value)
      pointer.set(newLinkedList.byteOffset)
    }
  }

  delete(key: IHash): void {
    this.fsm.assertAllocated()

    const hash = this.getHash(key)
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

  private createNewLinkedList(keyHash: number, value: PickReadableWritable<ValueView>) {
    const byteOffset = this.allocator.allocate(this.InternalLinkedListView.byteLength)
    const linkedList = new this.InternalLinkedListView(
      this.allocator.buffer
    , byteOffset
    )
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
