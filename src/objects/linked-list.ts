import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { OwnershipPointerView } from '@views/ownership-pointer-view'
import { LinkedListView, ViewConstructor, LinkedListStructure, TupleKey } from '@views/linked-list-view'
import { MapStructureToTupleValue } from '@views/tuple-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'

export class LinkedList<View extends BaseView & IHash & IReadableWritable<unknown>>
extends BaseObject
implements ICopy<LinkedList<View>>
         , IClone<LinkedList<View>>
         , IReadableWritable<MapStructureToTupleValue<LinkedListStructure<View>>>
         , IHash
         , IDestroy
         , IReference {
  static create<View extends BaseView & IHash & IReadableWritable<unknown>>(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToTupleValue<LinkedListStructure<View>>
  ): LinkedList<View> {
    return new this(ConstructorType.Create, allocator, viewConstructor, value)
  }

  static from<View extends BaseView & IHash & IReadableWritable<unknown>>(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  ): LinkedList<View> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , viewConstructor
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: LinkedListView<View>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly viewConstructor: ViewConstructor<View>

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , value: MapStructureToTupleValue<LinkedListStructure<View>>
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , value: MapStructureToTupleValue<LinkedListStructure<View>>
    ]
  | [
      type: ConstructorType.Reproduce
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, viewConstructor, value] = args
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

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, viewConstructor, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = counter

        const view = new LinkedListView<View>(
          allocator.buffer
        , byteOffset
        , viewConstructor
        )
        this._view = view

        return
      }
    }
  }

  hash(hasher: IHasher): void {
    this.fsm.assertAllocated()

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

    this._counter.increment()

    return new LinkedList(
      ConstructorType.Reproduce
    , this.allocator
    , this.viewConstructor
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): LinkedList<View> {
    this.fsm.assertAllocated()

    return new LinkedList(
      ConstructorType.Create
    , this.allocator
    , this.viewConstructor
    , this.get()
    )
  }

  get(): MapStructureToTupleValue<LinkedListStructure<View>> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToTupleValue<LinkedListStructure<View>>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  setNext(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next]): void {
    this.fsm.assertAllocated()

    this._view.setNext(value)
  }

  getNext(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Next] {
    this.fsm.assertAllocated()

    return this._view.getNext()
  }

  setValue(value: MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value]): void {
    this.fsm.assertAllocated()

    this._view.setValue(value)
  }

  getValue(): MapStructureToTupleValue<LinkedListStructure<View>>[TupleKey.Value] {
    this.fsm.assertAllocated()

    return this._view.getValue()
  }

  getViewOfValue(): View {
    this.fsm.assertAllocated()

    return this._view.getViewOfValue()
  }

  getViewOfNext(): OwnershipPointerView<LinkedListView<View>> {
    this.fsm.assertAllocated()

    return this._view.getViewOfNext()
  }

  derefNext(): LinkedListView<View> | null {
    this.fsm.assertAllocated()

    return this._view.derefNext()
  }
}
