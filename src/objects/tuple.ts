import { IAllocator, ICopy, IReferenceCounted, IReadableWritable, IHash, IHasher } from '@src/types'
import { MapStructureToValue, ViewConstructor, TupleView } from '@views/tuple-view'
import { NonEmptyArray } from '@blackglory/prelude'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { ReturnTypeOfConstructor } from 'hotypes'

export class Tuple<
  Structure extends NonEmptyArray<ViewConstructor<unknown>>
> implements ICopy<Tuple<Structure>>
           , IReferenceCounted<Tuple<Structure>>
           , IReadableWritable<MapStructureToValue<Structure>>
           , IHash {
  readonly _view: TupleView<Structure>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private structure: Structure

  constructor(allocator: IAllocator, structure: Structure, value: MapStructureToValue<Structure>)
  constructor(
    _allocator: IAllocator
  , _structure: Structure
  , _offset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [allocator: IAllocator, structure: Structure, value: MapStructureToValue<Structure>]
  | [allocator: IAllocator, structure: Structure, offset: number, counter: ReferenceCounter]
  ) {
    if (args.length === 3) {
      const [allocator, structure, value] = args
      this.allocator = allocator
      this.structure = structure
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(TupleView.getByteLength(structure))
      const view = new TupleView<Structure>(allocator.buffer, offset, structure)
      view.set(value)
      this._view = view
    } else {
      const [allocator, structure, offset, counter] = args
      this.allocator = allocator
      this.structure = structure

      const view = new TupleView<Structure>(allocator.buffer, offset, structure)
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

  clone(): Tuple<Structure> {
    this.fsm.assertAllocated()

    return new Tuple(this.allocator, this.structure, this._view.byteOffset, this._counter)
  }

  copy(): Tuple<Structure> {
    this.fsm.assertAllocated()

    return new Tuple(this.allocator, this.structure, this.get())
  }

  get(): MapStructureToValue<Structure> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToValue<Structure>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  getByIndex<U extends number & keyof Structure>(
    index: U
  ): MapStructureToValue<Structure>[U] {
    return this._view.getByIndex(index)
  }

  setByIndex<U extends number & keyof Structure>(index: U, value: MapStructureToValue<Structure>[U]): void {
    this._view.setByIndex(index, value)
  }

  getViewByIndex<U extends number & keyof Structure>(
    index: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    return this._view.getViewByIndex(index)
  }
}
