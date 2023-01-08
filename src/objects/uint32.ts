import { IAllocator, ICopy, IClone, IDestroy, IReadableWritable, IHash, IHasher } from '@src/types'
import { Uint32View } from '@views/uint32-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { BaseObject } from '@objects/base-object'

export class Uint32
extends BaseObject
implements ICopy<Uint32>
         , IClone<Uint32>
         , IReadableWritable<number>
         , IHash
         , IDestroy {
  readonly _view: Uint32View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: number)
  constructor(_allocator: IAllocator, _byteOffset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: number]
  | [allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(Uint32View.byteLength)
      const view = new Uint32View(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, byteOffset, counter] = args
      this.allocator = allocator

      const view = new Uint32View(allocator.buffer, byteOffset)
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

  clone(): Uint32 {
    this.fsm.assertAllocated()

    return new Uint32(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Uint32 {
    this.fsm.assertAllocated()

    return new Uint32(this.allocator, this.get())
  }

  get(): number {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(value: number): void {
    this.fsm.assertAllocated()

    this._view.set(value)
  }
}
