import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Int32View } from '@views/int32-view'
import { ObjectStateMachine, ReferenceCounter } from './utils'
import { BaseObject } from '@objects/base-object'
import { Int32Literal } from '@literals/int32-literal'

export class Int32
extends BaseObject
implements ICopy<Int32>
         , IClone<Int32>
         , IReadableWritable<Int32Literal>
         , IHash
         , IDestroy {
  readonly _view: Int32View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: Int32Literal)
  constructor(_allocator: IAllocator, _byteOffset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: Int32Literal]
  | [allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const byteOffset = allocator.allocate(Int32View.byteLength)
      const view = new Int32View(allocator.buffer, byteOffset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, byteOffset, counter] = args
      this.allocator = allocator

      const view = new Int32View(allocator.buffer, byteOffset)
      this._view = view

      counter.increment()
      this._counter = counter
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

  clone(): Int32 {
    this.fsm.assertAllocated()

    return new Int32(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Int32 {
    this.fsm.assertAllocated()

    return new Int32(this.allocator, this.get())
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
