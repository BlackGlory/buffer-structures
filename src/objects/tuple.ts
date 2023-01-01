import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable } from '@src/types'
import { MapStructureToValue, ViewConstructor, TupleView } from '@views/tuple-view'
import { NonEmptyArray } from '@blackglory/prelude'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Tuple<
  T extends NonEmptyArray<ViewConstructor<unknown>>
> implements ICopy<Tuple<T>>
           , IReferenceCounted<Tuple<T>>
           , IReadable<MapStructureToValue<T>>
           , IWritable<MapStructureToValue<T>> {
  readonly _view: TupleView<T>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private structure: T

  constructor(allocator: IAllocator, structure: T, value: MapStructureToValue<T>)
  constructor(
    _allocator: IAllocator
  , _structure: T
  , _offset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [allocator: IAllocator, structure: T, value: MapStructureToValue<T>]
  | [allocator: IAllocator, structure: T, offset: number, counter: ReferenceCounter]
  ) {
    if (args.length === 3) {
      const [allocator, structure, value] = args
      this.allocator = allocator
      this.structure = structure
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(TupleView.getByteLength(structure))
      const view = new TupleView<T>(allocator.buffer, offset, structure)
      view.set(value)
      this._view = view
    } else {
      const [allocator, structure, offset, counter] = args
      this.allocator = allocator
      this.structure = structure

      const view = new TupleView<T>(allocator.buffer, offset, structure)
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

  clone(): Tuple<T> {
    this.fsm.assertAllocated()

    return new Tuple(this.allocator, this.structure, this._view.byteOffset, this._counter)
  }

  copy(): Tuple<T> {
    this.fsm.assertAllocated()

    return new Tuple(this.allocator, this.structure, this.get())
  }

  get(): MapStructureToValue<T> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToValue<T>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  getByIndex<U extends number & keyof T>(index: U): MapStructureToValue<T>[U] {
    return this._view.getByIndex(index)
  }

  setByIndex<U extends number & keyof T>(index: U, value: MapStructureToValue<T>[U]): void {
    this._view.setByIndex(index, value)
  }
}
