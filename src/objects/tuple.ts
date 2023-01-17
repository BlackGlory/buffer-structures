import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { TupleView, ViewConstructor, MapStructureToTupleValue } from '@views/tuple-view'
import { NonEmptyArray } from '@blackglory/prelude'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { ReturnTypeOfConstructor } from 'hotypes'
import { BaseObject } from '@objects/base-object'

export class Tuple<
  Structure extends NonEmptyArray<
    ViewConstructor<IReadableWritable<unknown> & IHash>
  >
>
extends BaseObject
implements ICopy<Tuple<Structure>>
         , IClone<Tuple<Structure>>
         , IReadableWritable<MapStructureToTupleValue<Structure>>
         , IHash
         , IDestroy {
  static create<
    Structure extends NonEmptyArray<
      ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , structure: Structure
  , value: MapStructureToTupleValue<Structure>
  ): Tuple<Structure> {
    return new this(ConstructorType.Create, allocator, structure, value)
  }

  static from<
    Structure extends NonEmptyArray<
      ViewConstructor<IReadableWritable<unknown> & IHash>
    >
  >(
    allocator: IAllocator
  , byteOffset: number
  , structure: Structure
  ): Tuple<Structure> {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , structure
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: TupleView<Structure>
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
  , value: MapStructureToTupleValue<Structure>
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
    , value: MapStructureToTupleValue<Structure>
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

        const byteOffset = allocator.allocate(TupleView.getByteLength(structure))
        const view = new TupleView<Structure>(allocator.buffer, byteOffset, structure)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, structure, byteOffset, counter] = args
        this.allocator = allocator
        this.structure = structure
        this._counter = counter

        const view = new TupleView<Structure>(allocator.buffer, byteOffset, structure)
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

  clone(): Tuple<Structure> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Tuple(
      ConstructorType.Reproduce
    , this.allocator
    , this.structure
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Tuple<Structure> {
    this.fsm.assertAllocated()

    return new Tuple(
      ConstructorType.Create
    , this.allocator
    , this.structure
    , this.get()
    )
  }

  get(): MapStructureToTupleValue<Structure> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: MapStructureToTupleValue<Structure>): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }

  getByIndex<U extends number & keyof Structure>(
    index: U
  ): MapStructureToTupleValue<Structure>[U] {
    this.fsm.assertAllocated()

    return this._view.getByIndex(index)
  }

  setByIndex<U extends number & keyof Structure>(
    index: U
  , value: MapStructureToTupleValue<Structure>[U]
  ): void {
    this.fsm.assertAllocated()

    this._view.setByIndex(index, value)
  }

  getViewByIndex<U extends number & keyof Structure>(
    index: U
  ): ReturnTypeOfConstructor<Structure[U]> {
    this.fsm.assertAllocated()

    return this._view.getViewByIndex(index)
  }
}
