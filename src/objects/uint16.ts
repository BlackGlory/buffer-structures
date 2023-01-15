import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Uint16View } from '@views/uint16-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Uint16Literal } from '@literals/uint16-literal'

export class Uint16
extends BaseObject
implements ICopy<Uint16>
         , IClone<Uint16>
         , IReadableWritable<Uint16Literal>
         , IHash
         , IDestroy {
  readonly _view: Uint16View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  static create(allocator: IAllocator, value: Uint16Literal): Uint16 {
    return new this(ConstructorType.Create, allocator, value)
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , value: Uint16Literal
  )
  private constructor(
    type: ConstructorType.Clone
  , allocator: IAllocator
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , value: Uint16Literal
    ]
  | [
      type: ConstructorType.Clone
    , allocator: IAllocator
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, value] = args
        this.allocator = allocator
        this._counter = new ReferenceCounter()

        const offset = allocator.allocate(Uint16View.byteLength)
        const view = new Uint16View(allocator.buffer, offset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Clone: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator

        const view = new Uint16View(allocator.buffer, byteOffset)
        this._view = view

        counter.increment()
        this._counter = counter

        return
      }
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

  clone(): Uint16 {
    this.fsm.assertAllocated()

    return new Uint16(
      ConstructorType.Clone
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Uint16 {
    this.fsm.assertAllocated()

    return new Uint16(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Uint16Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Uint16Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
