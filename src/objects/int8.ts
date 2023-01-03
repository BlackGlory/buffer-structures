import { IAllocator, ICopy, IReferenceCounted, IReadableWritable, IHash, IHasher } from '@src/types'
import { Int8View } from '@views/int8-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Int8 implements ICopy<Int8>
                           , IReferenceCounted<Int8>
                           , IReadableWritable<number>
                           , IHash {
  readonly _view: Int8View
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: number)
  constructor(_allocator: IAllocator, _offset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: number]
  | [allocator: IAllocator, offset: number, counter: ReferenceCounter]
  ) {
    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(Int8View.byteLength)
      const view = new Int8View(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, offset, counter] = args
      this.allocator = allocator

      const view = new Int8View(allocator.buffer, offset)
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
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): Int8 {
    this.fsm.assertAllocated()

    return new Int8(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Int8 {
    this.fsm.assertAllocated()

    return new Int8(this.allocator, this.get())
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
