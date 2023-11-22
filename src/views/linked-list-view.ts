import { IHash, ISized, IReference, IReadableWritable, IFree } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { OwnershipPointerView } from '@views/ownership-pointer-view.js'
import { isntNull } from '@blackglory/prelude'
import { TupleView, MapStructureToTupleValue } from '@views/tuple-view.js'
import { BaseView } from '@views/base-view.js'
import { withLazyStatic, lazyStatic } from 'extra-lazy'
import { NULL } from '@src/null.js'

export type ViewConstructor<View extends BaseView> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type OwnershipPointerViewConstructor<View extends BaseView & IHash & IFree> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => OwnershipPointerView<View>)

export type LinkedListStructure<
  View extends BaseView & IHash & IReadableWritable<unknown>
> = [
  next: OwnershipPointerViewConstructor<LinkedListView<View>>
, value: ViewConstructor<View>
]

export enum TupleKey {
  Next
, Value
}

const createOwnershipPointerView = withLazyStatic(<
  View extends BaseView & IReadableWritable<unknown> & IHash
>(viewConstructor: ViewConstructor<View>) => {
  return lazyStatic(() => {
    class InternalLinkedListView extends LinkedListView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor)
      }
    }

    class InternalOwnershipPointerView extends OwnershipPointerView<LinkedListView<View>> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    return InternalOwnershipPointerView
  }, [viewConstructor])
})

export class LinkedListView<View extends BaseView & IReadableWritable<unknown> & IHash>
extends BaseView
implements IHash
         , IReference
         , IReadableWritable<MapStructureToTupleValue<LinkedListStructure<View>>>
         , ISized
         , IFree {
  static getByteLength(
    viewConstructor: ViewConstructor<
      BaseView
    & IReadableWritable<unknown>
    & IHash
    >
  ): number {
    return viewConstructor.byteLength + OwnershipPointerView.byteLength
  }

  readonly byteLength = LinkedListView.getByteLength(this.viewConstructor)

  private view: TupleView<LinkedListStructure<View>>

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<View>
  ) {
    super()

    this.view = new TupleView(buffer, byteOffset, [
      createOwnershipPointerView(viewConstructor)
    , viewConstructor
    ])
  }

  free(allocator: IAllocator): void {
    this.view.free(allocator)
  }

  hash(hasher: IHasher): void {
    const valueView = this.view.getViewByIndex(TupleKey.Value)
    valueView.hash(hasher)

    const nextView = this.derefNext()
    if (isntNull(nextView)) {
      nextView.hash(hasher)
    } else {
      hasher.write(NULL)
    }
  }

  get(): MapStructureToTupleValue<LinkedListStructure<View>> {
    return this.view.get()
  }

  set(value: MapStructureToTupleValue<LinkedListStructure<View>>): void {
    this.view.set(value)
  }

  setNext(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next]): void {
    this.view.setByIndex(TupleKey.Next, value)
  }

  getNext(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next] {
    return this.view.getByIndex(TupleKey.Next)
  }

  setValue(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value]): void {
    this.view.setByIndex(TupleKey.Value, value)
  }

  getValue(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value] {
    return this.view.getByIndex(TupleKey.Value)
  }

  getViewOfValue(): View {
    return this.view.getViewByIndex(TupleKey.Value)
  }

  getViewOfNext(): OwnershipPointerView<LinkedListView<View>> {
    return this.view.getViewByIndex(TupleKey.Next)
  }

  derefNext(): LinkedListView<View> | null {
    const offset = this.getNext()
    if (isntNull(offset)) {
      return new LinkedListView(this.buffer, offset.get(), this.viewConstructor)
    } else {
      return null
    }
  }
}
