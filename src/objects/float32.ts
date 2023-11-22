import { ICopy, IClone, IDestroy, IReadableWritable, IHash, IReference } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { Float32View } from '@views/float32-view.js'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils.js'
import { BaseObject } from '@objects/base-object.js'
import { Float32Literal } from '@literals/float32-literal.js'

export class Float32
extends BaseObject
implements ICopy<Float32>
         , IClone<Float32>
         , IReadableWritable<Float32Literal>
         , IHash
         , IDestroy
         , IReference {
  static create(allocator: IAllocator, value: Float32Literal): Float32 {
    return new this(ConstructorType.Create, allocator, value)
  }

  static from(allocator: IAllocator, byteOffset: number): Float32 {
    return new this(
      ConstructorType.Reproduce
    , allocator
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: Float32View
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
  , value: Float32Literal
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
    , value: Float32Literal
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

        const offset = allocator.allocate(Float32View.byteLength)
        const view = new Float32View(allocator.buffer, offset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator
        this._counter = counter

        const view = new Float32View(allocator.buffer, byteOffset)
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

  clone(): Float32 {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Float32(
      ConstructorType.Reproduce
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Float32 {
    this.fsm.assertAllocated()

    return new Float32(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Float32Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Float32Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
