import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable, IHash, IHasher } from '@src/types'
import { FloatView } from '@views/float-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class Float implements ICopy<Float>
                            , IReferenceCounted<Float>
                            , IReadable<number>
                            , IWritable<number>
                            , IHash {
  readonly _view: FloatView
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

      const offset = allocator.allocate(FloatView.byteLength)
      const view = new FloatView(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, offset, counter] = args
      this.allocator = allocator

      const view = new FloatView(allocator.buffer, offset)
      this._view = view

      counter.increment()
      this._counter = counter
    }
  }

  hash(hasher: IHasher): void {
    this.hash(hasher)
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): Float {
    this.fsm.assertAllocated()

    return new Float(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): Float {
    this.fsm.assertAllocated()

    return new Float(this.allocator, this.get())
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
