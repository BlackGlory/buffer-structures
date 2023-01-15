import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Float64View } from '@views/float64-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { BaseObject } from '@objects/base-object'
import { Float64Literal } from '@literals/float64-literal'

export class Float64
extends BaseObject
implements ICopy<Float64>
         , IClone<Float64>
         , IReadableWritable<Float64Literal>
         , IHash
         , IDestroy {
  readonly _view: Float64View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  static create(allocator: IAllocator, value: Float64Literal): Float64 {
    return new this(ConstructorType.Create, allocator, value)
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , value: Float64Literal
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
    , value: Float64Literal
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

        const byteOffset = allocator.allocate(Float64View.byteLength)
        const view = new Float64View(allocator.buffer, byteOffset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Clone: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator

        const view = new Float64View(allocator.buffer, byteOffset)
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

  clone(): Float64 {
    this.fsm.assertAllocated()

    return new Float64(
      ConstructorType.Clone
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Float64 {
    this.fsm.assertAllocated()

    return new Float64(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): Float64Literal {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: Float64Literal): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
