import { IAllocator, ICopy, IClone, IDestroy, IReadableWritable, IHash, IHasher } from '@src/types'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { LinkedListView, ViewConstructor, Structure } from '@views/linked-list-view'
import { MapStructureToValue } from '@views/struct-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { BaseObject } from './base-object'

export class LinkedList<
  View extends IHash & IReadableWritable<Value>
, Value = View extends IReadableWritable<infer T> ? T : never
>
extends BaseObject
implements ICopy<LinkedList<View, Value>>
         , IClone<LinkedList<View, Value>>
         , IReadableWritable<MapStructureToValue<Structure<View, Value>>>
         , IHash
         , IDestroy {
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
  , _byteOffset: number
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
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    if (args.length === 3) {
      const [allocator, viewConstructor, value] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this._counter = new ReferenceCounter()

      const byteOffset = allocator.allocate(LinkedListView.getByteLength(viewConstructor))
      const view = new LinkedListView<View, Value>(
        allocator.buffer
      , byteOffset
      , viewConstructor
      )
      view.set(value)
      this._view = view
    } else {
      const [allocator, viewConstructor, byteOffset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor

      const view = new LinkedListView<View, Value>(
        allocator.buffer
      , byteOffset
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
      this._view.free(this.allocator)
    }
  }

  clone(): LinkedList<View, Value> {
    this.fsm.assertAllocated()

    return new LinkedList(
      this.allocator
    , this.viewConstructor
    , this._view.byteOffset
    , this._counter
    )
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

  getViewOfValue(): View {
    return this._view.getViewOfValue()
  }

  getViewOfNext(): OwnershipPointerView<LinkedListView<View, Value>> {
    return this._view.getViewOfNext()
  }

  derefNext(): LinkedListView<View, Value> | null {
    return this._view.derefNext()
  }
}
