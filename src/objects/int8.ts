import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Int8View } from '@views/int8-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Int8Literal } from '@literals/int8-literal'

export class Int8
extends BaseObject
implements ICopy<Int8>
         , IClone<Int8>
         , IReadableWritable<Int8Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: Int8Literal): Int8 {
    return new this(ConstructorType.Create, allocator, value)
  }

  static from(allocator: IAllocator, byteOffset: number): Int8 {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: Int8View
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
  , value: Int8Literal
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [type: ConstructorType.Create, allocator: IAllocator, value: Int8Literal]
  | [type: ConstructorType.Reproduce, allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, value] = args
        this.allocator = allocator
        this._counter = new ReferenceCounter()

        const byteOffset = allocator.allocate(Int8View.byteLength)
        const view = new Int8View(allocator.buffer, byteOffset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator
        this._counter = counter

        const view = new Int8View(allocator.buffer, byteOffset)
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

  clone(): Int8 {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Int8(
      ConstructorType.Reproduce
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Int8 {
    this.fsm.assertAllocated()

    return new Int8(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Int8Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Int8Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
