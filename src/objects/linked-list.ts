import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { LinkedListView, ViewConstructor, LinkedListStructure, TupleKey } from '@views/linked-list-view'
import { MapStructureToTupleValue } from '@views/tuple-view'
import { ObjectStateMachine, ReferenceCounter } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'

export class LinkedList<View extends BaseView & IHash & IReadableWritable<unknown>>
extends BaseObject
implements ICopy<LinkedList<View>>
         , IClone<LinkedList<View>>
         , IReadableWritable<MapStructureToTupleValue<LinkedListStructure<View>>>
         , IHash
         , IDestroy {
  readonly _view: LinkedListView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToTupleValue<LinkedListStructure<View>>
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
    , value: MapStructureToTupleValue<LinkedListStructure<View>>
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
      const view = new LinkedListView<View>(
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

      const view = new LinkedListView<View>(
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

  clone(): LinkedList<View> {
    this.fsm.assertAllocated()

    return new LinkedList(
      this.allocator
    , this.viewConstructor
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): LinkedList<View> {
    this.fsm.assertAllocated()

    return new LinkedList(this.allocator, this.viewConstructor, this.get())
  }

  get(): MapStructureToTupleValue<LinkedListStructure<View>> {
    return this._view.get()
  }

  set(value: MapStructureToTupleValue<LinkedListStructure<View>>): void {
    this._view.set(value)
  }

  setNext(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next]): void {
    this._view.setNext(value)
  }

  getNext(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next] {
    return this._view.getNext()
  }

  setValue(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value]): void {
    this._view.setValue(value)
  }

  getValue(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value] {
    return this._view.getValue()
  }

  getViewOfValue(): View {
    return this._view.getViewOfValue()
  }

  getViewOfNext(): OwnershipPointerView<LinkedListView<View>> {
    return this._view.getViewOfNext()
  }

  derefNext(): LinkedListView<View> | null {
    return this._view.derefNext()
  }
}
