import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Int16View } from '@views/int16-view'
import { ObjectStateMachine, ReferenceCounter } from './utils'
import { BaseObject } from '@objects/base-object'
import { Int16Literal } from '@literals/int16-literal'

export class Int16
extends BaseObject
implements ICopy<Int16>
         , IClone<Int16>
         , IReadableWritable<Int16Literal>
         , IHash
         , IDestroy {
  readonly _view: Int16View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: Int16Literal)
  constructor(_allocator: IAllocator, _byteOffset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: Int16Literal]
  | [allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const byteOffset = allocator.allocate(Int16View.byteLength)
      const view = new Int16View(allocator.buffer, byteOffset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, byteOffset, counter] = args
      this.allocator = allocator

      const view = new Int16View(allocator.buffer, byteOffset)
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

  clone(): Int16 {
    this.fsm.assertAllocated()

    return new Int16(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Int16 {
    this.fsm.assertAllocated()

    return new Int16(this.allocator, this.get())
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
