import { IHash, IHasher, ISized, IReference, IReadable, IWritable } from '@src/types'
import { StructView, MapStructureToValue } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'
import { isntNull } from '@blackglory/prelude'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type PointerViewConstructor<View extends IHash> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export type Structure<View extends IHash & IReadable<Value> & IWritable<Value>, Value> = {
  next: PointerViewConstructor<LinkedListView<View, Value>>
  value: ViewConstructor<View>
}

export class LinkedListView<
  View extends IReadable<Value> & IWritable<Value> & IHash
, Value
> implements IHash
           , IReference
           , IReadable<MapStructureToValue<Structure<View, Value>>>
           , IWritable<MapStructureToValue<Structure<View, Value>>>
           , ISized {
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

  hash(hasher: IHasher): void {
    const valueView = this.view.getViewByKey('value')
    valueView.hash(hasher)

    const nextView = this.deferNext()
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

  deferNext(): LinkedListView<View, Value> | null {
    const offset = this.getNext()
    if (isntNull(offset)) {
      return new LinkedListView(this.buffer, offset, this.viewConstructor)
    } else {
      return null
    }
  }
}
