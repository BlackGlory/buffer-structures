import { IAllocator, ICopy, IReferenceCounted, IReadable, IWritable } from '@src/types'
import { ViewConstructor, ArrayView } from '@views/array-view'
import { ObjectStateMachine } from '@utils/object-state-machine'
import { ReferenceCounter } from '@utils/reference-counter'
import { FixedLengthArray } from 'justypes'

export class Array<
  T
, Length extends number
> implements ICopy<Array<T, Length>>
           , IReferenceCounted<Array<T, Length>>
           , IReadable<FixedLengthArray<T, Length>>
           , IWritable<FixedLengthArray<T, Length>> {
  readonly _view: ArrayView<T, Length>
  readonly _counter: ReferenceCounter
  private fsm = new ObjectStateMachine()
  private allocator: IAllocator
  private viewConstructor: ViewConstructor<T>
  private length: Length

  constructor(
    allocator: IAllocator
  , viewConstructor: ViewConstructor<T>
  , length: Length
  , values?: FixedLengthArray<T, Length>
  )
  constructor(
    _allocator: IAllocator
  , _viewConstructor: ViewConstructor<T>
  , _length: Length
  , _offset: number
  , _counter: ReferenceCounter
  )
  constructor(...args:
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<T>
    , length: Length
    , values?: FixedLengthArray<T, Length>
    ]
  | [
      allocator: IAllocator
    , viewConstructor: ViewConstructor<T>
    , length: Length
    , offset: number
    , counter: ReferenceCounter
    ]
  ) {
    if (args.length === 5) {
      const [allocator, viewConstructor, length, offset, counter] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.length = length

      const view = new ArrayView<T, Length>(
        allocator.buffer
      , offset
      , viewConstructor
      , length
      )
      this._view = view

      counter.increment()
      this._counter = counter
    } else {
      const [allocator, viewConstructor, length, values] = args
      this.allocator = allocator
      this.viewConstructor = viewConstructor
      this.length = length
      this._counter = new ReferenceCounter()

      const offset = allocator.allocate(ArrayView.getByteLength(viewConstructor, length))
      const view = new ArrayView<T, Length>(
        allocator.buffer
      , offset
      , viewConstructor
      , length
      )
      if (values) {
        view.set(values)
      }
      this._view = view
    }
  }

  destroy(): void {
    this.fsm.free()

    this._counter.decrement()
    if (this._counter.isZero()) {
      this.allocator.free(this._view.byteOffset)
    }
  }

  clone(): Array<T, Length> {
    this.fsm.assertAllocated()

    return new Array(
      this.allocator
    , this.viewConstructor
    , this.length
    , this._view.byteOffset
    , this._counter
    )
  }

  copy(): Array<T, Length> {
    this.fsm.assertAllocated()

    return new Array(this.allocator, this.viewConstructor, this.length, this.get())
  }

  get(): FixedLengthArray<T, Length> {
    this.fsm.assertAllocated()

    return this._view.get()
  }

  set(values: FixedLengthArray<T, Length>): void {
    this.fsm.assertAllocated()

    this._view.set(values)
  }

  getByIndex(index: number): T {
    return this._view.getByIndex(index)
  }

  setByIndex(index: number, value: T): void {
    this._view.setByIndex(index, value)
  }
}
