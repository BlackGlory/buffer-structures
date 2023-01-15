import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { StructView, ViewConstructor, MapStructureToValue } from '@views/struct-view'
import { ObjectStateMachine, ReferenceCounter } from './utils'
import { ReturnTypeOfConstructor } from 'hotypes'
import { BaseObject } from '@objects/base-object'

export class Struct<
  Structure extends Record<
    string
  , ViewConstructor<IReadableWritable<unknown> & IHash>
  >
>
extends BaseObject
implements ICopy<Struct<Structure>>
         , IClone<Struct<Structure>>
         , IReadableWritable<MapStructureToValue<Structure>>
         , IHash
         , IDestroy {
  readonly _view: StructView<Structure>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private structure: Structure

  constructor(
    allocator: IAllocator
  , structure: Structure
  , value: MapStructureToValue<Structure>
  )
  constructor(
    _allocator: IAllocator
  , _structure: Structure
  , _byteOffset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [allocator: IAllocator, structure: Structure, value: MapStructureToValue<Structure>]
  | [
      allocator: IAllocator
    , structure: Structure
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

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
      const [allocator, structure, byteOffset, counter] = args
      this.allocator = allocator
      this.structure = structure

      const view = new StructView<Structure>(allocator.buffer, byteOffset, structure)
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

  setByKey<U extends string & keyof Structure>(
    key: U
  , value: MapStructureToValue<Structure>[U]
  ): void {
    this._view.setByKey(key, value)
  }

  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    return this._view.getViewByKey(key)
  }
}
