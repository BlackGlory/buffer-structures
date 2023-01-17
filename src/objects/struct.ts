import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { StructView, ViewConstructor, MapStructureToValue } from '@views/struct-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
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
         , IDestroy
         , IReference {
  static create<
    Structure extends Record<
      string
    , ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , structure: Structure
  , value: MapStructureToValue<Structure>
  ): Struct<Structure> {
    return new this(ConstructorType.Create, allocator, structure, value)
  }

  static from<
    Structure extends Record<
      string
    , ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , byteOffset: number
  , structure: Structure
  ): Struct<Structure> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , structure
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: StructView<Structure>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly structure: Structure

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , structure: Structure
  , value: MapStructureToValue<Structure>
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , structure: Structure
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , structure: Structure
    , value: MapStructureToValue<Structure>
    ]
  | [
      type: ConstructorType.Reproduce
    , allocator: IAllocator
    , structure: Structure
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, structure, value] = args
        this.allocator = allocator
        this.structure = structure
        this._counter = new ReferenceCounter()

        const offset = allocator.allocate(StructView.getByteLength(structure))
        const view = new StructView<Structure>(allocator.buffer, offset, structure)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, structure, byteOffset, counter] = args
        this.allocator = allocator
        this.structure = structure
        this._counter = counter

        const view = new StructView<Structure>(allocator.buffer, byteOffset, structure)
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

  clone(): Struct<Structure> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Struct(
      ConstructorType.Reproduce
    , this.allocator
    , this.structure
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Struct<Structure> {
    this.fsm.assertAllocated()

    return new Struct(
      ConstructorType.Create
    , this.allocator
    , this.structure
    , this.get()
    )
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
    this.fsm.assertAllocated()

    return this._view.getByKey(key)
  }

  setByKey<U extends string & keyof Structure>(
    key: U
  , value: MapStructureToValue<Structure>[U]
  ): void {
    this.fsm.assertAllocated()

    this._view.setByKey(key, value)
  }

  getViewByKey<U extends string & keyof Structure>(
    key: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    this.fsm.assertAllocated()

    return this._view.getViewByKey(key)
  }
}
