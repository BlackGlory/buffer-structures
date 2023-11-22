import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { Int16View } from '@views/int16-view.js'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils.js'
import { BaseObject } from '@objects/base-object.js'
import { Int16Literal } from '@literals/int16-literal.js'

export class Int16
extends BaseObject
implements ICopy<Int16>
         , IClone<Int16>
         , IReadableWritable<Int16Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: Int16Literal): Int16 {
    return new this(ConstructorType.Create, allocator, value)
  }

  static from(allocator: IAllocator, byteOffset: number): Int16 {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: Int16View
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
  , value: Int16Literal
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
    , value: Int16Literal
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

        const byteOffset = allocator.allocate(Int16View.byteLength)
        const view = new Int16View(allocator.buffer, byteOffset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator
        this._counter = counter

        const view = new Int16View(allocator.buffer, byteOffset)
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

  clone(): Int16 {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Int16(
      ConstructorType.Reproduce
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Int16 {
    this.fsm.assertAllocated()

    return new Int16(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Int16Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Int16Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
