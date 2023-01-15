import { ICopy, IClone, IDestroy, IReadable, IHash } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { StringView } from '@views/string-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
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

  static create(allocator: IAllocator, value: StringLiteral): String {
    return new this(ConstructorType.Create, allocator, value)
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , value: StringLiteral
  )
  private constructor(
    type: ConstructorType.Clone
  , allocator: IAllocator
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [type: ConstructorType.Create, allocator: IAllocator, value: StringLiteral]
  | [type: ConstructorType.Clone, allocator: IAllocator, byteOffset: number, counter: ReferenceCounter]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, value] = args
        this.allocator = allocator
        this._counter = new ReferenceCounter()

        const offset = allocator.allocate(StringView.getByteLength(value.get()))
        const view = new StringView(allocator.buffer, offset)
        view.set(value)
        this._view = view

        return
      }
      case ConstructorType.Clone: {
        const [, allocator, byteOffset, counter] = args
        this.allocator = allocator

        const view = new StringView(allocator.buffer, byteOffset)
        this._view = view

        counter.increment()
        this._counter = counter

        return
      }
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

    return new String(
      ConstructorType.Clone
    , this.allocator
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): String {
    this.fsm.assertAllocated()

    return new String(
      ConstructorType.Create
    , this.allocator
    , this.get()
    )
  }

  get(): StringLiteral {
    this.fsm.assertAllocated()

    return this._view.get()
  }
}
