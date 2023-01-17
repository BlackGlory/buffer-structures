import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Int32View } from '@views/int32-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Int32Literal } from '@literals/int32-literal'

export class Int32
extends BaseObject
implements ICopy<Int32>
         , IClone<Int32>
         , IReadableWritable<Int32Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: Int32Literal): Int32 {
    return new this(ConstructorType.Create, allocator, value)
  }

  static from(allocator: IAllocator, byteOffset: number): Int32 {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: Int32View
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
  , value: Int32Literal
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
    , value: Int32Literal
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

        const byteOffset = allocator.allocate(Int32View.byteLength)
        const view = new Int32View(allocator.buffer, byteOffset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator
        this._counter = counter

        const view = new Int32View(allocator.buffer, byteOffset)
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

  clone(): Int32 {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Int32(
      ConstructorType.Reproduce
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Int32 {
    this.fsm.assertAllocated()

    return new Int32(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Int32Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Int32Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
