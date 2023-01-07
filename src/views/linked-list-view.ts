import { IAllocator, IHash, IHasher, ISized, IReference, IReadableWritable, IFree } from '@src/types'
import { PointerView } from '@views/pointer-view'
import { isntNull } from '@blackglory/prelude'
import { StructView, MapStructureToValue } from '@views/struct-view'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

type PointerViewConstructor<View extends IHash> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export type Structure<View extends IHash & IReadableWritable<Value>, Value> = {
  next: PointerViewConstructor<LinkedListView<View, Value>>
  value: ViewConstructor<View>
}

export class LinkedListView<
  View extends IReadableWritable<Value> & IHash
, Value = View extends IReadableWritable<infer T> ? T : never
> implements IHash
           , IReference
           , IReadableWritable<MapStructureToValue<Structure<View, Value>>>
           , ISized
           , IFree {
  static getByteLength(viewConstructor: ViewConstructor<unknown>) {
    return viewConstructor.byteLength + PointerView.byteLength
  }

  readonly byteLength = LinkedListView.getByteLength(this.viewConstructor)

  private view: StructView<Structure<View, Value>>

  constructor(
    private buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , private viewConstructor: ViewConstructor<View>
  ) {
    class InternalLinkedListView extends LinkedListView<View, Value> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor)
      }
    }

    class InternalPointerView extends PointerView<LinkedListView<View, Value>> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    this.view = new StructView(buffer, byteOffset, {
      next: InternalPointerView
    , value: viewConstructor
    })
  }

  free(allocator: IAllocator): void {
    allocator.free(this.byteOffset)
  }

  hash(hasher: IHasher): void {
    const valueView = this.view.getViewByKey('value')
    valueView.hash(hasher)

    const nextView = this.derefNext()
    if (isntNull(nextView)) {
      nextView.hash(hasher)
    } else {
      hasher.write([0])
    }
  }

  get(): MapStructureToValue<Structure<View, Value>> {
    return this.view.get()
  }

  set(value: MapStructureToValue<Structure<View, Value>>): void {
    this.view.set(value)
  }

  setNext(value: MapStructureToValue<Structure<View, Value>>['next']): void {
    this.view.setByKey('next', value)
  }

  getNext(): MapStructureToValue<Structure<View, Value>>['next'] {
    return this.view.getByKey('next')
  }

  setValue(value: MapStructureToValue<Structure<View, Value>>['value']): void {
    this.view.setByKey('value', value)
  }

  getValue(): MapStructureToValue<Structure<View, Value>>['value'] {
    return this.view.getByKey('value')
  }

  getViewOfValue(): View {
    return this.view.getViewByKey('value')
  }

  getViewOfNext(): PointerView<LinkedListView<View, Value>> {
    return this.view.getViewByKey('next')
  }

  derefNext(): LinkedListView<View, Value> | null {
    const offset = this.getNext()
    if (isntNull(offset)) {
      return new LinkedListView(this.buffer, offset, this.viewConstructor)
    } else {
      return null
    }
  }
}
