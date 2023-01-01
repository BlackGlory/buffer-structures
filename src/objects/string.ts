import { IAllocator, ICopy, IReferenceCounted, IReadable } from '@src/types'
import { StringView } from '@views/string-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'

export class String implements ICopy<String>
                             , IReferenceCounted<String>
                             , IReadable<string> {
  readonly _view: StringView
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: string)
  constructor(_allocator: IAllocator, _offset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: string]
  | [allocator: IAllocator, offset: number, counter: ReferenceCounter]
  ) {
    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(StringView.getByteLength(value))
      const view = new StringView(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, offset, counter] = args
      this.allocator = allocator

      const view = new StringView(allocator.buffer, offset)
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

  clone(): String {
    this.fsm.assertAllocated()

    return new String(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): String {
    this.fsm.assertAllocated()

    return new String(this.allocator, this.get())
  }

  get(): string {
    this.fsm.assertAllocated()

    return this._view.get()
  }
}
