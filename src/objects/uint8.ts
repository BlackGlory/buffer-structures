import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable, IHash, IHasher } from '@src/types'
import { Uint8View } from '@views/uint8-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Uint8 implements ICopy<Uint8>
                            , IReferenceCounted<Uint8>
                            , IReadable<number>
                            , IWritable<number>
                            , IHash {
  readonly _view: Uint8View
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

      const offset = allocator.allocate(Uint8View.byteLength)
      const view = new Uint8View(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, offset, counter] = args
      this.allocator = allocator

      const view = new Uint8View(allocator.buffer, offset)
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

  clone(): Uint8 {
    this.fsm.assertAllocated()

    return new Uint8(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Uint8 {
    this.fsm.assertAllocated()

    return new Uint8(this.allocator, this.get())
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
