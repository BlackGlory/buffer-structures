import { IAllocator, ISized, ICopy, IReferenceCounted, IReadableWritable, IHash, IHasher } from '@src/types'
import { MapStructureToValue } from '@views/struct-view'
import { PointerView } from '@views/pointer-view'
import { LinkedListView, Structure } from '@views/linked-list-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export type ViewConstructor<View> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => View)

export type PointerViewConstructor<View extends IHash> =
  ISized
& (new (buffer: ArrayBufferLike, byteOffset: number) => PointerView<View>)

export class LinkedList<
  View extends IHash & IReadableWritable<Value>
, Value = View extends IReadableWritable<infer T> ? T : never
> implements ICopy<LinkedList<View, Value>>
           , IReferenceCounted<LinkedList<View, Value>>
           , IReadableWritable<MapStructureToValue<Structure<View, Value>>>
           , IHash {
  readonly _view: LinkedListView<View, Value>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToValue<Structure<View, Value>>
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
    , value: MapStructureToValue<Structure<View, Value>>
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
      const view = new LinkedListView<View, Value>(
        allocator.buffer
      , offset
      , viewConstructor
      )
      view.set(value)
      this._view = view
    } else {
      const [allocator, viewConstructor, offset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const view = new LinkedListView<View, Value>(
        allocator.buffer
      , offset
      , viewConstructor
      )
      this._view = view

      counter.increment()
      this._counter = counter
    }
  }

  hash(hasher: IHasher): void {
    this._view.hash(hasher)
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): LinkedList<View, Value> {
    this.fsm.assertAllocated()

    return new LinkedList(this.allocator,this.viewConstructor , this._view.byteOffset, this._counter)
  }

  copy(): LinkedList<View, Value> {
    this.fsm.assertAllocated()

    return new LinkedList(this.allocator, this.viewConstructor, this.get())
  }

  get(): MapStructureToValue<Structure<View, Value>> {
    return this._view.get()
  }

  set(value: MapStructureToValue<Structure<View, Value>>): void {
    this._view.set(value)
  }

  setNext(value: MapStructureToValue<Structure<View, Value>>['next']): void {
    this._view.setNext(value)
  }

  getNext(): MapStructureToValue<Structure<View, Value>>['next'] {
    return this._view.getNext()
  }

  setValue(value: MapStructureToValue<Structure<View, Value>>['value']): void {
    this._view.setValue(value)
  }

  getValue(): MapStructureToValue<Structure<View, Value>>['value'] {
    return this._view.getValue()
  }
}
