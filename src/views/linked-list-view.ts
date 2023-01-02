import { ISized, IReference, IReadable, IWritable } from '@src/types'
import { StructView, MapStructureToValue } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type PointerViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export type Structure<View extends IReadable<unknown> & IWritable<unknown>> = {
  next: PointerViewConstructor<LinkedListView<View>>
  value: ViewConstructor<View>
}

export class LinkedListView<
  View extends IReadable<unknown> & IWritable<unknown>
> implements IReference
           , IReadable<MapStructureToValue<Structure<View>>>
           , IWritable<MapStructureToValue<Structure<View>>> {
  static getByteLength(view: ViewConstructor<unknown>) {
    return view.byteLength + PointerView.byteLength
  }

  readonly view: StructView<Structure<View>>

  constructor(
    buffer: ArrayBufferLike
  , public readonly byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ) {
    class InternalLinkedListView extends LinkedListView<View> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, viewConstructor)
      }
    }

    class InternalPointerView extends PointerView<LinkedListView<View>> {
      constructor(buffer: ArrayBufferLike, byteOffset: number) {
        super(buffer, byteOffset, InternalLinkedListView)
      }
    }

    this.view = new StructView(buffer, byteOffset, {
      next: InternalPointerView
    , value: viewConstructor
    })
  }

  get(): MapStructureToValue<Structure<View>> {
    return this.view.get()
  }

  set(value: MapStructureToValue<Structure<View>>): void {
    this.view.set(value)
  }

  setNext(value: MapStructureToValue<Structure<View>>['next']): void {
    this.view.setByKey('next', value)
  }

  getNext(): MapStructureToValue<Structure<View>>['next'] {
    return this.view.getByKey('next')
  }

  setValue(value: MapStructureToValue<Structure<View>>['value']): void {
    this.view.setByKey('value', value)
  }

  getValue(): MapStructureToValue<Structure<View>>['value'] {
    return this.view.getByKey('value')
  }
}
