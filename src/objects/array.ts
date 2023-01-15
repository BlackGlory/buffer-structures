import { ICopy, IClone, IDestroy, IHash, IReadableWritable } from '@src/traits'
import { IAllocator, IHasher } from '@src/interfaces'
import { UnpackedReadableWritable } from '@src/types'
import { ViewConstructor, ArrayView } from '@views/array-view'
import { ObjectStateMachine, ReferenceCounter, ConstructorType } from './utils'
import { FixedLengthArray } from 'justypes'
import { BaseObject } from '@objects/base-object'
import { BaseView } from '@views/base-view'

export class Array<
  View extends BaseView & IReadableWritable<unknown> & IHash
, Length extends number
>
extends BaseObject
implements ICopy<Array<View, Length>>
         , IClone<Array<View, Length>>
         , IHash
         , IDestroy {
  readonly _view: ArrayView<View, Length>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<View>
  private length: Length

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

  private constructor(
    type: ConstructorType.Create
  , allocator: IAllocator
  , viewConstructor: ViewConstructor<View>
  , length: Length
  , values?: FixedLengthArray<UnpackedReadableWritable<View>, Length>
  )
  private constructor(
    type: ConstructorType.Clone
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
    , values?: FixedLengthArray<View, Length>
    ]
  | [
      type: ConstructorType.Clone
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
        this.length = length
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
      case ConstructorType.Clone: {
        const [, allocator, viewConstructor, length, byteOffset, counter] = args
        this.allocator = allocator
        this.viewConstructor = viewConstructor
        this.length = length

        const view = new ArrayView<View, Length>(
          allocator.buffer
        , byteOffset
        , viewConstructor
        , length
        )
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

  clone(): Array<View, Length> {
    this.fsm.assertAllocated()

    return new Array(
      ConstructorType.Clone
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
    return this._view.getByIndex(index)
  }

  setByIndex(index: number, value: UnpackedReadableWritable<View>): void {
    this._view.setByIndex(index, value)
  }

  getViewByIndex(index: number): View {
    return this._view.getViewByIndex(index)
  }
}
