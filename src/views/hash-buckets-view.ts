import { ISized, IHash, IReadableWritable, IReference, IFree } from '@src/traits'
import { IAllocator } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ArrayView } from '@views/array-view'
import { LinkedListView } from '@views/linked-list-view'
import { Uint32View } from '@views/uint32-view'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { TupleView } from '@views/tuple-view'
import { BaseView } from '@views/base-view'
import { uint32 } from '@literals/uint32-literal'
import { lazyStatic, withLazyStatic } from 'extra-lazy'

type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

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

enum TupleKey {
  Hash
, Value
}

const createInternalViews = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(
  viewConstructor: ViewConstructor<View>
): {
  InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>
  InternalLinkedListOwnershipPointerView: ViewConstructor<IInternalLinkedListOwnershipPointerView<View>>
} => {
  const structure = lazyStatic(() => {
    return [Uint32View, viewConstructor] satisfies [
      hash: typeof Uint32View
    , value: ViewConstructor<View>
    ]
  }, [viewConstructor])

  return lazyStatic((): {
    InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>
    InternalLinkedListOwnershipPointerView: ViewConstructor<IInternalLinkedListOwnershipPointerView<View>>
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

    return {
      InternalLinkedListView
    , InternalLinkedListOwnershipPointerView
    }
  }, [structure])
})

export class HashBucketsView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IReference
         , IFree
         , ISized {
  private view: ArrayView<
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
  private InternalLinkedListView: ViewConstructor<IInternalLinkedListView<View>>

  static getByteLength<View extends BaseView & IReadableWritable<unknown> & IHash>(
    viewConstructor: ViewConstructor<View>
  , capacity: number
  ) {
    const { InternalLinkedListOwnershipPointerView } = createInternalViews(viewConstructor)

    return ArrayView.getByteLength(
      InternalLinkedListOwnershipPointerView
    , capacity
    )
  }

  byteLength: number

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , public readonly capacity: number
  ) {
    super()

    const {
      InternalLinkedListView
    , InternalLinkedListOwnershipPointerView
    } = createInternalViews(viewConstructor)
    this.InternalLinkedListView = InternalLinkedListView

    this.byteLength = HashBucketsView.getByteLength(viewConstructor, capacity)
    this.view = new ArrayView(
      buffer
    , byteOffset
    , InternalLinkedListOwnershipPointerView
    , capacity
    )
  }

  free(allocator: IAllocator): void {
    this.view.free(allocator)
  }

  getByIndex(
    index: number
  ): UnpackedReadableWritable<IInternalLinkedListOwnershipPointerView<View>> {
    return this.view.getByIndex(index)
  }

  setByIndex(
    index: number
  , value: UnpackedReadableWritable<IInternalLinkedListOwnershipPointerView<View>>
  ): void {
    this.view.setByIndex(index, value)
  }

  getViewByIndex(index: number): IInternalLinkedListOwnershipPointerView<View> {
    return this.view.getViewByIndex(index)
  }

  * itemValues(): IterableIterator<View> {
    for (let i = 0; i < this.capacity; i++) {
      const pointer = this.view.getViewByIndex(i)

      let linkedList = pointer.deref()
      while (linkedList) {
        const item = linkedList.getViewOfValue()
        yield item.getViewByIndex(TupleKey.Value)
        linkedList = linkedList.derefNext()
      }
    }
  }

  hasItem(hash: number): boolean {
    const index = keyHashToIndex(this.capacity, hash)
    const pointer = this.view.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const item = linkedList.getViewOfValue()
      const keyHash = item.getByIndex(TupleKey.Hash).get()
      if (hash === keyHash) {
        return true
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  getItem(hash: number): View | null {
    const index = keyHashToIndex(this.capacity, hash)
    const pointer = this.view.getViewByIndex(index)

    let linkedList = pointer.deref()
    while (linkedList) {
      const item = linkedList.getViewOfValue()
      const keyHash = item.getByIndex(TupleKey.Hash).get()
      if (hash === keyHash) {
        return item.getViewByIndex(TupleKey.Value)
      } else {
        linkedList = linkedList.derefNext()
      }
    }

    return linkedList
  }

  /**
   * @returns 是否插入了项目.
   */
  addItem(
    allocator: IAllocator
  , hash: number
  , value: UnpackedReadableWritable<View>
  ): boolean {
    const index = keyHashToIndex(this.capacity, hash)
    const pointer = this.view.getViewByIndex(index)

    let linkedList = pointer.deref()
    if (linkedList) {
      while (true) {
        const struct = linkedList.getViewOfValue()
        const keyHash = struct.getByIndex(TupleKey.Hash).get()
        if (hash === keyHash) {
          struct.setByIndex(TupleKey.Value, value)
          return false
        } else {
          const nextLinkedList = linkedList.derefNext()
          if (nextLinkedList) {
            linkedList = nextLinkedList
          } else {
            const newLinkedList = this.createLinkedList(allocator, hash, value)
            linkedList.setNext(uint32(newLinkedList.byteOffset))
            return true
          }
        }
      }
    } else {
      const newLinkedList = this.createLinkedList(allocator, hash, value)
      pointer.set(uint32(newLinkedList.byteOffset))
      return true
    }
  }

  /**
   * @returns 是否删除了项目.
   */
  deleteItem(allocator: IAllocator, hash: number): boolean {
    const index = this.getItemIndex(hash)
    const pointer = this.view.getViewByIndex(index)

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
      const keyHash = struct.getByIndex(TupleKey.Hash).get()
      if (hash === keyHash) {
        const next = linkedList.getNext()
        if (previous instanceof OwnershipPointerView) {
          previous.set(next)
        } else {
          previous.setNext(next)
        }
        linkedList.setNext(null)
        linkedList.free(allocator)
        return true
      } else {
        previous = linkedList
        linkedList = linkedList.derefNext()
      }
    }

    return false
  }

  transfer(newBuckets: HashBucketsView<View>): void {
    for (let i = 0; i < this.capacity; i++) {
      const oldPointer = this.getViewByIndex(i)

      let oldLinkedList = oldPointer.deref()
      if (oldLinkedList) {
        oldPointer.set(null)
      }

      while (oldLinkedList) {
        const [hash, value] = oldLinkedList.getValue()
        const newIndex = keyHashToIndex(newBuckets.capacity, hash.get())

        const newPointer = newBuckets.getViewByIndex(newIndex)
        let newLinkedList = newPointer.deref()
        if (newLinkedList) {
          while (true) {
            const struct = newLinkedList.getViewOfValue()
            const newKeyHash = struct.getByIndex(TupleKey.Hash)
            if (hash === newKeyHash) {
              struct.setByIndex(TupleKey.Value, value)
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

  private getItemIndex(hash: number): number {
    const index = hash % this.capacity
    return index
  }
}

function keyHashToIndex(capacity: number, hash: number): number {
  const index = hash % capacity
  return index
}
