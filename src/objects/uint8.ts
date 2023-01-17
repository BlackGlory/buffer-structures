import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Uint8View } from '@views/uint8-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Uint8Literal } from '@literals/uint8-literal'

export class Uint8
extends BaseObject
implements ICopy<Uint8>
         , IClone<Uint8>
         , IReadableWritable<Uint8Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: Uint8Literal): Uint8 {
    return new this(ConstructorType.Create, allocator, value)
  }

  static from(allocator: IAllocator, byteOffset: number): Uint8 {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: Uint8View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , value: Uint8Literal
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , value: Uint8Literal
    ]
  | [
      type: ConstructorType.Reproduce
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

        const byteOffset = allocator.allocate(Uint8View.byteLength)
        const view = new Uint8View(allocator.buffer, byteOffset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator
        this._counter = counter

        const view = new Uint8View(allocator.buffer, byteOffset)
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

  clone(): Uint8 {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Uint8(
      ConstructorType.Reproduce
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Uint8 {
    this.fsm.assertAllocated()

    return new Uint8(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Uint8Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Uint8Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
