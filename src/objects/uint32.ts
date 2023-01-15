import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Uint32View } from '@views/uint32-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Uint32Literal } from '@literals/uint32-literal'

export class Uint32
extends BaseObject
implements ICopy<Uint32>
         , IClone<Uint32>
         , IReadableWritable<Uint32Literal>
         , IHash
         , IDestroy {
  readonly _view: Uint32View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  static create(allocator: IAllocator, value: Uint32Literal): Uint32 {
    return new this(ConstructorType.Create, allocator, value)
  }

  constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , value: Uint32Literal
  )
  constructor(
    type: ConstructorType.Clone
  , allocator: IAllocator
  , byteOffset: number
  , counter: ReferenceCounter
  )
  constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , value: Uint32Literal
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

        const offset = allocator.allocate(Uint32View.byteLength)
        const view = new Uint32View(allocator.buffer, offset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Clone: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator

        const view = new Uint32View(allocator.buffer, byteOffset)
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

  clone(): Uint32 {
    this.fsm.assertAllocated()

    return new Uint32(
      ConstructorType.Clone
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Uint32 {
    this.fsm.assertAllocated()

    return new Uint32(ConstructorType.Create, this.allocator, this.get())
  }

  get(): Uint32Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Uint32Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
