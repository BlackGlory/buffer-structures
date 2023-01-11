import { ICopy, IClone, IDestroy, IReadableWritable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { Uint8View } from '@views/uint8-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { BaseObject } from '@objects/base-object'
import { Uint8Literal } from '@literals/uint8-literal'

export class Uint8
extends BaseObject
implements ICopy<Uint8>
         , IClone<Uint8>
         , IReadableWritable<Uint8Literal>
         , IHash
         , IDestroy {
  readonly _view: Uint8View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: Uint8Literal)
  constructor(_allocator: IAllocator, _byteOffset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: Uint8Literal]
  | [allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const byteOffset = allocator.allocate(Uint8View.byteLength)
      const view = new Uint8View(allocator.buffer, byteOffset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, byteOffset, counter] = args
      this.allocator = allocator

      const view = new Uint8View(allocator.buffer, byteOffset)
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

  clone(): Uint8 {
    this.fsm.assertAllocated()

    return new Uint8(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Uint8 {
    this.fsm.assertAllocated()

    return new Uint8(this.allocator, this.get())
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
