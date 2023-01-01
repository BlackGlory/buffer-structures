import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable } from '@src/types'
import { Uint16View } from '@views/uint16-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Uint16 implements ICopy<Uint16>
                             , IReferenceCounted<Uint16>
                             , IReadable<number>
                             , IWritable<number> {
  readonly _view: Uint16View
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

      const offset = allocator.allocate(Uint16View.byteLength)
      const view = new Uint16View(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, offset, counter] = args
      this.allocator = allocator

      const view = new Uint16View(allocator.buffer, offset)
      this._view = view

      counter.increment()
      this._counter = counter
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): Uint16 {
    this.fsm.assertAllocated()

    return new Uint16(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Uint16 {
    this.fsm.assertAllocated()

    return new Uint16(this.allocator, this.get())
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
