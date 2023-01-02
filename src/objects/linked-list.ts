import { IAllocator, ISized, ICopy, IReferenceCounted, IReadable, IWritable } from '@src/types'
import { MapStructureToValue } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'
import { LinkedListView, Structure } from '@views/linked-list-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type PointerViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export class LinkedList<
  View extends IReadable<unknown> & IWritable<unknown>
> implements ICopy<LinkedList<View>>
           , IReferenceCounted<LinkedList<View>>
           , IReadable<MapStructureToValue<Structure<View>>>
           , IWritable<MapStructureToValue<Structure<View>>> {
  readonly _view: LinkedListView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToValue<Structure<View>>
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<View>
  , _offset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , value: MapStructureToValue<Structure<View>>
    ]
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , offset: number
    , counter: ReferenceCounter
    ]
  ) {
    if (args.length === 3) {
      const [allocator, viewConstructor, value] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(LinkedListView.getByteLength(viewConstructor))
      const view = new LinkedListView(allocator.buffer, offset, viewConstructor)
      view.set(value)
      this._view = view
    } else {
      const [allocator, viewConstructor, offset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const view = new LinkedListView(allocator.buffer, offset, viewConstructor)
      this._view = view

      counter.increment()
      this._counter = counter
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): LinkedList<View> {
    this.fsm.assertAllocated()

    return new LinkedList(this.allocator,this.viewConstructor , this._view.byteOffset, this._counter)
  }

  copy(): LinkedList<View> {
    this.fsm.assertAllocated()

    return new LinkedList(this.allocator, this.viewConstructor, this.get())
  }

  get(): MapStructureToValue<Structure<View>> {
    return this._view.get()
  }

  set(value: MapStructureToValue<Structure<View>>): void {
    this._view.set(value)
  }

  setNext(value: MapStructureToValue<Structure<View>>['next']): void {
    this._view.setNext(value)
  }

  getNext(): MapStructureToValue<Structure<View>>['next'] {
    return this._view.getNext()
  }

  setValue(value: MapStructureToValue<Structure<View>>['value']): void {
    this._view.setValue(value)
  }

  getValue(): MapStructureToValue<Structure<View>>['value'] {
    return this._view.getValue()
  }
}
