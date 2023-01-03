import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable, IHash, IHasher } from '@src/types'
import { MapStructureToValue, ViewConstructor, StructView } from '@views/struct-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Struct<
  T extends Record<string, ViewConstructor<unknown>>
> implements ICopy<Struct<T>>
           , IReferenceCounted<Struct<T>>
           , IReadable<MapStructureToValue<T>>
           , IWritable<MapStructureToValue<T>>
           , IHash {
  readonly _view: StructView<T>
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

      const offset = allocator.allocate(StructView.getByteLength(structure))
      const view = new StructView<T>(allocator.buffer, offset, structure)
      view.set(value)
      this._view = view
    } else {
      const [allocator, structure, offset, counter] = args
      this.allocator = allocator
      this.structure = structure

      const view = new StructView<T>(allocator.buffer, offset, structure)
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

  clone(): Struct<T> {
    this.fsm.assertAllocated()

    return new Struct(this.allocator, this.structure, this._view.byteOffset, this._counter)
  }

  copy(): Struct<T> {
    this.fsm.assertAllocated()

    return new Struct(this.allocator, this.structure, this.get())
  }

  get(): MapStructureToValue<T> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToValue<T>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  getByKey<U extends string & keyof T>(key: U): MapStructureToValue<T>[U] {
    return this._view.getByKey(key)
  }

  setByKey<U extends string & keyof T>(key: U, value: MapStructureToValue<T>[U]): void {
    this._view.setByKey(key, value)
  }
}
