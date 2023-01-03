import { IAllocator, ICopy, IReferenceCounted, IReadableWritable, IHash, IHasher } from '@src/types'
import { MapStructureToValue, ViewConstructor, StructView } from '@views/struct-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { ReturnTypeOfConstructor } from 'hotypes'

export class Struct<
  Structure extends Record<string, ViewConstructor<unknown>>
> implements ICopy<Struct<Structure>>
           , IReferenceCounted<Struct<Structure>>
           , IReadableWritable<MapStructureToValue<Structure>>
           , IHash {
  readonly _view: StructView<Structure>
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

      const offset = allocator.allocate(StructView.getByteLength(structure))
      const view = new StructView<Structure>(allocator.buffer, offset, structure)
      view.set(value)
      this._view = view
    } else {
      const [allocator, structure, offset, counter] = args
      this.allocator = allocator
      this.structure = structure

      const view = new StructView<Structure>(allocator.buffer, offset, structure)
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

  clone(): Struct<Structure> {
    this.fsm.assertAllocated()

    return new Struct(this.allocator, this.structure, this._view.byteOffset, this._counter)
  }

  copy(): Struct<Structure> {
    this.fsm.assertAllocated()

    return new Struct(this.allocator, this.structure, this.get())
  }

  get(): MapStructureToValue<Structure> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToValue<Structure>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  getByKey<U extends string & keyof Structure>(key: U): MapStructureToValue<Structure>[U] {
    return this._view.getByKey(key)
  }

  setByKey<U extends string & keyof Structure>(key: U, value: MapStructureToValue<Structure>[U]): void {
    this._view.setByKey(key, value)
  }

  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    return this._view.getViewByKey(key)
  }
}
