import { ICopy, IClone, IDestroy, IHash, IReadableWritable, IReference } from '@src/traits.js'
import { IAllocator, IHasher } from '@src/interfaces.js'
import { UnpackedReadableWritable } from '@src/types.js'
import { ViewConstructor, ArrayView } from '@views/array-view.js'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils.js'
import { FixedLengthArray } from 'justypes'
import { BaseObject } from '@objects/base-object.js'
import { BaseView } from '@views/base-view.js'

export class Array<
  View extends BaseView & IReadableWritable<unknown> & IHash
, Length extends number
>
extends BaseObject
implements ICopy<Array<View, Length>>
         , IClone<Array<View, Length>>
         , IHash
         , IDestroy
         , IReference {
  static create<
    View extends BaseView & IReadableWritable<unknown> & IHash
  , Length extends number
  >(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , values?: FixedLengthArray<UnpackedReadableWritable<View>, Length>
  ): Array<View, Length> {
    return new this<View, Length>(
      ConstructorType.Create
    , allocator
    , viewConstructor
    , length
    , values
    )
  }

  static from<
    View extends BaseView & IReadableWritable<unknown> & IHash
  , Length extends number
  >(
    allocator: IAllocator
  , byteOffset: number
  , viewConstructor: ViewConstructor<View>
  , length: Length
  ): Array<View, Length> {
    return new this<View, Length>(
      ConstructorType.Reproduce
    , allocator
    , viewConstructor
    , length
    , byteOffset
    , new ReferenceCounter()
    )
  }

  readonly _view: ArrayView<View, Length>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  readonly viewConstructor: ViewConstructor<View>

  get length(): Length {
    this.fsm.assertAllocated()

    return this._view.length
  }

  get byteOffset(): number {
    this.fsm.assertAllocated()

    return this._view.byteOffset
  }

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , values?: FixedLengthArray<UnpackedReadableWritable<View>, Length>
  )
  private constructor(
    type: ConstructorType.Reproduce
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , byteOffset: number
  , counter: ReferenceCounter
  )
  private constructor(...args:
  | [
      type: ConstructorType.Create
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , length: Length
    , values?: FixedLengthArray<UnpackedReadableWritable<View>, Length>
    ]
  | [
      type: ConstructorType.Reproduce
    , allocator: IAllocator
    , viewConstructor: ViewConstructor<View>
    , length: Length
    , byteOffset: number
    , counter: ReferenceCounter
    ]
  ) {
    super()

    const [type] = args
    switch (type) {
      case ConstructorType.Create: {
        const [, allocator, viewConstructor, length, values] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this._counter = new ReferenceCounter()

        const byteOffset = allocator.allocate(
          ArrayView.getByteLength(viewConstructor, length)
        )
        const view = new ArrayView<View, Length>(
          allocator.buffer
        , byteOffset
        , viewConstructor
        , length
        )
        if (values) {
          view.set(values)
        }
        this._view = view

        return
      }
      case ConstructorType.Reproduce: {
        const [, allocator, viewConstructor, length, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor

        const view = new ArrayView<View, Length>(
          allocator.buffer
        , byteOffset
        , viewConstructor
        , length
        )
        this._view = view
        this._counter = counter

        return
      }
    }
  }

  hash(hasher: IHasher): void {
    this.fsm.assertAllocated()

    this._view.hash(hasher)
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this._view.free(this.allocator)
    }
  }

  clone(): Array<View, Length> {
    this.fsm.assertAllocated()

    this._counter.increment()

    return new Array(
      ConstructorType.Reproduce
    , this.allocator
    , this.viewConstructor
    , this.length
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Array<View, Length> {
    this.fsm.assertAllocated()

    return new Array(
      ConstructorType.Create
    , this.allocator
    , this.viewConstructor
    , this.length
    , this.get()
    )
  }

  get(): FixedLengthArray<UnpackedReadableWritable<View>, Length> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(values: FixedLengthArray<UnpackedReadableWritable<View>, Length>): void {
    this.fsm.assertAllocated()

    this._view.set(values)
  }

  getByIndex(index: number): UnpackedReadableWritable<View> {
    this.fsm.assertAllocated()

    return this._view.getByIndex(index)
  }

  setByIndex(index: number, value: UnpackedReadableWritable<View>): void {
    this.fsm.assertAllocated()

    this._view.setByIndex(index, value)
  }

  getViewByIndex(index: number): View {
    this.fsm.assertAllocated()

    return this._view.getViewByIndex(index)
  }
}
