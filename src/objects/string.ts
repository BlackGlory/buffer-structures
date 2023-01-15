import { ICopy, IClone, IDestroy, IReadable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { StringView } from '@views/string-view'
import { ObjectStateMachine, ReferenceCounter } from './utils'
import {} from './utils'
import { BaseObject } from '@objects/base-object'
import { StringLiteral } from '@literals/string-literal'

export class String
extends BaseObject
implements ICopy<String>
         , IClone<String>
         , IReadable<StringLiteral>
         , IHash
         , IDestroy {
  readonly _view: StringView
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator

  constructor(allocator: IAllocator, value: StringLiteral)
  constructor(_allocator: IAllocator, _byteOffset: number, _counter: ReferenceCounter)
  constructor(...args:
  | [allocator: IAllocator, value: StringLiteral]
  | [allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    if (args.length === 2) {
      const [allocator, value] = args
      this.allocator = allocator
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(StringView.getByteLength(value.get()))
      const view = new StringView(allocator.buffer, offset)
      view.set(value)
      this._view = view
    } else {
      const [allocator, byteOffset, counter] = args
      this.allocator = allocator

      const view = new StringView(allocator.buffer, byteOffset)
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

  clone(): String {
    this.fsm.assertAllocated()

    return new String(this.allocator, this._view.byteOffset, this._counter)
  }

  copy(): String {
    this.fsm.assertAllocated()

    return new String(this.allocator, this.get())
  }

  get(): StringLiteral {
    this.fsm.assertAllocated()

    return this._view.get()
  }
}
